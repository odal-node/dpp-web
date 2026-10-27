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
//   * A `#fragment` must name an id on the page it lands on, so a reworded
//     heading cannot leave its old anchor links pointing at nothing.
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
// index.html: the two shapes Astro's static output emits. Returns that file,
// or null.
const resolveFile = (dist, path) => {
  const clean = decodeURI(path.split('#')[0].split('?')[0]);
  const candidates =
    clean === '' || clean === '/'
      ? [join(dist, 'index.html')]
      : extname(clean)
        ? [join(dist, clean)]
        : [join(dist, clean, 'index.html'), `${join(dist, clean)}.html`];
  return candidates.find((c) => existsSync(c)) ?? null;
};

// A fragment resolves if the page it lands on has an element with that id. A
// renamed heading changes its id, and the link to it still finds the page, so
// a path-only check passes it while the reader lands at the top. Pages whose
// anchors exist only after a script runs are listed here and skipped.
const SCRIPT_ANCHORED = new Set([join('site/dpp-docs/dist', 'api', 'index.html')]);
const idCache = new Map();
const idsOf = (file) => {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    idCache.set(file, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
};
const fragmentOf = (attr) => {
  const hash = attr.indexOf('#');
  if (hash === -1 || hash === attr.length - 1) return null;
  return decodeURIComponent(attr.slice(hash + 1));
};

const broken = [];
let linkCount = 0;
let anchorCount = 0;
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

      if (attr.startsWith('#')) {
        // An anchor on this page: only the fragment can be wrong.
        const fragment = fragmentOf(attr);
        if (fragment === null) continue;
        anchorCount += 1;
        if (!idsOf(file).has(fragment)) {
          broken.push({ from: relative(process.cwd(), file), target: attr });
        }
        continue;
      }

      if (attr.startsWith('/')) {
        target = attr;
      } else {
        const other = SITES.find((s) => attr.startsWith(`${s.origin}/`) || attr === s.origin);
        if (other) {
          target = attr.slice(other.origin.length) || '/';
          dist = other.dist;
        }
      }

      // mailto: and third-party origins are out of scope.
      if (target === null) continue;
      linkCount += 1;
      const landed = resolveFile(dist, target);
      if (landed === null) {
        broken.push({ from: relative(process.cwd(), file), target: attr });
        continue;
      }
      const fragment = fragmentOf(target);
      if (fragment !== null && extname(landed) === '.html' && !SCRIPT_ANCHORED.has(landed)) {
        anchorCount += 1;
        if (!idsOf(landed).has(fragment)) {
          broken.push({ from: relative(process.cwd(), file), target: attr });
        }
      }
    }
  }
}

if (broken.length === 0) {
  console.log(
    `link check: ${linkCount} internal links and ${anchorCount} anchors across ${pageCount} pages, all resolve.`,
  );
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
