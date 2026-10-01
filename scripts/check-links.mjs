// Crawl both built sites for internal links that resolve to nothing.
//
// `astro check` type-checks templates and validates content-collection
// references, but a markdown link target is an opaque string to it. Four
// `[Licensing](/engine/licensing)` links passed `check` and 404'd in production,
// because the page's source file is underscore-prefixed and never routed.
//
// This runs over `dist`, so it sees what is actually published rather than what
// the source appears to promise. Two things follow from that:
//
//   * Astro's redirect stubs carry a real <a href> to their target, so a stub
//     pointing at a missing page is caught without parsing meta-refresh.
//   * Cross-site links are resolved against the *other* site's build. A link
//     from the docs to odal-node.io/roadmap is invisible to either site's own
//     tooling, which is exactly how that one survived.
//
// Usage: node scripts/check-links.mjs
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const SITES = [
  { origin: 'https://odal-node.io', dist: 'site/dpp-landing/dist', name: 'odal-node.io' },
  { origin: 'https://docs.odal-node.io', dist: 'site/dpp-docs/dist', name: 'docs.odal-node.io' },
];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (extname(full) === '.html') out.push(full);
  }
  return out;
};

// A published path resolves if it names a real file, or a directory holding an
// index.html — the two shapes Astro's static output emits.
const resolves = (dist, path) => {
  const clean = decodeURI(path.split('#')[0].split('?')[0]);
  if (clean === '' || clean === '/') return existsSync(join(dist, 'index.html'));
  const base = join(dist, clean);
  if (extname(clean)) return existsSync(base);
  return existsSync(join(base, 'index.html')) || existsSync(`${base}.html`);
};

const broken = [];
let linkCount = 0;
let pageCount = 0;

for (const site of SITES) {
  if (!existsSync(site.dist)) {
    console.error(`link check: ${site.dist} not found — run \`pnpm -r build\` first.`);
    process.exit(1);
  }

  for (const file of walk(site.dist)) {
    pageCount += 1;
    // Astro preserves HTML comments in its output, and this repo comments out
    // links rather than deleting them. A commented-out link is not published.
    const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const [, attr] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      // A canonical is a declaration about this page, not a dependency of it.
      // The 404 page necessarily self-canonicalises to a path that is not a
      // route, because it is served at every unmatched path.
      if (html.includes(`rel="canonical" href="${attr}"`)) continue;
      let target = null;
      let dist = site.dist;

      if (attr.startsWith('/')) {
        target = attr;
      } else {
        const other = SITES.find((s) => attr.startsWith(`${s.origin}/`) || attr === s.origin);
        if (other) {
          target = attr.slice(other.origin.length) || '/';
          dist = other.dist;
        }
      }

      // Anchors, mailto:, and third-party origins are out of scope.
      if (target === null) continue;
      linkCount += 1;
      if (!resolves(dist, target)) {
        broken.push({ from: relative(process.cwd(), file), target: attr });
      }
    }
  }
}

if (broken.length === 0) {
  console.log(`link check: ${linkCount} internal links across ${pageCount} pages, all resolve.`);
  process.exit(0);
}

console.error(`link check: ${broken.length} broken internal link(s).\n`);
const byTarget = new Map();
for (const b of broken) {
  if (!byTarget.has(b.target)) byTarget.set(b.target, []);
  byTarget.get(b.target).push(b.from);
}
for (const [target, sources] of [...byTarget].sort((a, b) => b[1].length - a[1].length)) {
  console.error(`  ${target}  <- ${sources.length} page(s)`);
  for (const s of sources.slice(0, 6)) console.error(`      ${s}`);
  if (sources.length > 6) console.error(`      … and ${sources.length - 6} more`);
}
process.exit(1);
