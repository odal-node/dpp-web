// Catch prose that will render with a word glued to a link.
//
// Astro trims the whitespace at a text node's boundary with an element. So
// this, which looks correct in the editor and formats correctly under
// Prettier:
//
//     <p>
//       The roadmap is reviewed fortnightly. See
//       <a href="…">the project board</a>
//       for live status.
//     </p>
//
// publishes as "fortnightly. Seethe project boardfor live status." Nothing
// catches it: it is valid HTML, `astro check` type-checks templates rather than
// reading them, and the link still resolves so `check-links` is happy. It is
// only visible by reading the rendered page, which is why twenty-eight of these
// reached `main` across the privacy, trust, waitlist, roadmap and about pages
// before anyone noticed.
//
// The fix is an explicit {" "} on the side that lost its space. This gate finds
// the sites that need one.
//
// WHY THIS READS SOURCE RATHER THAN `dist`
//
// In the built HTML the defect is indistinguishable from legitimate text: a
// schema page prints `anodeMaterial` and a footnote prints `<code>x</code>s`,
// both of which are a word touching a tag on purpose. In the source the
// difference is unambiguous — a line of prose ending in a letter, and an inline
// element beginning the next line. So the rule is stated where it is exact.
//
// Usage: node scripts/check-inline-spacing.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['site/dpp-landing/src', 'site/dpp-docs/src'];

// Elements that sit inside a sentence. A block element (<p>, <div>, <li>)
// starting a new line is a paragraph break, not a lost space.
const INLINE = 'a|strong|em|code|b|i|abbr|small';

// A line ending in prose, then an inline element opening the next line.
// The trailing character must be prose — a letter, digit or sentence
// punctuation. Anything else is markup or an expression boundary: `=> (`,
// `&& (`, `>` and `{` all legitimately precede an element with no space,
// and matching them would bury the real findings in noise.
const OPENS = new RegExp(String.raw`[A-Za-z0-9,;:.’—-][ \t]*\n[ \t]*<(?:${INLINE})[\s>]`, 'g');

// An inline element closing at the end of a line, then prose on the next.
const CLOSES = new RegExp(String.raw`</(?:${INLINE})>[ \t]*\n[ \t]*[A-Za-z0-9“]`, 'g');

// The same trim happens where prose meets a `{…}` expression, which is how
// "by 2027."Four passport obligations" reached staging on 2026-09-25: a
// sentence ending one line and a computed sentence `{lead}` opening the next.
// Checked in the template only (frontmatter and <script>/<style> blocks are
// blanked first), because braces in code are code. Only a value expression
// standing alone in prose counts (`{lead}`, `{group.name}`, `{n}`): an
// attribute (`href={x}`, preceded by `=`), the `{" "}` fix itself, and the
// braces of a `.map(…)` block are not prose and never lose a space.
const VALUE = String.raw`\{[A-Za-z_$][\w$.?]*(?:\([^(){}\n]*\))?\}`;
const EXPR_OPENS = new RegExp(String.raw`[A-Za-z0-9,;:.!?’”"')][ \t]*\n[ \t]*${VALUE}`, 'g');
const EXPR_CLOSES = new RegExp(String.raw`(?<![=\w])${VALUE}[ \t]*\n[ \t]*[A-Za-z0-9“]`, 'g');

/** Blank everything that is not template, keeping line numbers intact. */
const templateOnly = (src) =>
  src
    .replace(/^---\n[\s\S]*?\n---\n/, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, (m) => m.replace(/[^\n]/g, ' '));

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (extname(full) === '.astro') out.push(full);
  }
  return out;
};

const findings = [];

for (const root of ROOTS) {
  let files;
  try {
    files = walk(root);
  } catch {
    continue; // a site that does not exist is not a failure
  }
  for (const file of files) {
    const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const template = templateOnly(raw);
    for (const [side, pattern, src] of [
      ['before', OPENS, raw],
      ['after', CLOSES, raw],
      ['before', EXPR_OPENS, template],
      ['after', EXPR_CLOSES, template],
    ]) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(src)) !== null) {
        const line = src.slice(0, m.index).split('\n').length;
        // The match itself is a single character either side of the newline,
        // which is not enough to find the sentence in a long page. Widen it to
        // the words around the break, and mark the break itself.
        const from = Math.max(0, m.index - 52);
        findings.push({
          file,
          line,
          side,
          excerpt: `${from > 0 ? '…' : ''}${src.slice(from, m.index + m[0].length)}`
            .replace(/[ \t]*\n[ \t]*/g, ' ⏎ ')
            .trim(),
        });
      }
    }
  }
}

if (findings.length === 0) {
  console.log('inline spacing: no glued words.');
  process.exit(0);
}

console.error(
  `inline spacing: ${findings.length} place(s) where a rendered word will be glued to an inline element.\n`,
);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}`);
  console.error(`      ${f.excerpt}`);
  console.error(
    `      → add {" "} ${f.side === 'before' ? 'at the end of the prose line' : 'after the closing tag'}\n`,
  );
}
process.exit(1);
