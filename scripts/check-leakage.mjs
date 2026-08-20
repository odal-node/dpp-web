// Fail the build if internal planning vocabulary or private-repo paths appear
// anywhere in this repository.
//
// This repo is public. Two classes leak here, and they need different scopes:
//
//   * Decision-record numbers. One reached `public/openapi.yaml`, which is
//     *served* at docs.odal-node.io/openapi.yaml and rendered into /api. A
//     convention that only reads the source tree would never have caught it,
//     which is why `public/` is explicitly in scope below.
//   * Paths into the private documentation repository. Several are clickable
//     relative links in READMEs that 404 for anyone browsing GitHub, and they
//     disclose that repo's internal structure.
//
// Public artefacts must be self-contained: restate the design inline rather
// than pointing at something the reader cannot open.
//
// Usage: node scripts/check-leakage.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative, extname, basename } from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.claude',
  'dist',
  '.astro',
  '.pnpm-store',
  '.dpp-engine',
  'deprecated',
]);
// This file necessarily contains the patterns it searches for.
const SKIP_FILES = new Set(['check-leakage.mjs']);
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2', '.pdf']);

const RULES = [
  {
    // eslint-disable-next-line no-useless-escape
    pattern: /ADR-\d+/g,
    why: 'a decision-record number — meaningless outside the private repo and stale inside it',
  },
  { pattern: /WEB_CONTENT_STRATEGY/g, why: 'a private-repo document path' },
  { pattern: /DESIGN_SPEC/g, why: 'a private-repo document path' },
  { pattern: /\bBRAND\.md\b/g, why: 'a private-repo document path' },
  { pattern: /\.\.\/\.\.\/docs\//g, why: 'a relative path into the private repo' },
];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (!BINARY.has(extname(full)) && !SKIP_FILES.has(basename(full))) out.push(full);
  }
  return out;
};

const hits = [];
const files = walk(process.cwd());

for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue; // unreadable or genuinely binary
  }
  const lines = text.split('\n');
  for (const rule of RULES) {
    lines.forEach((line, i) => {
      const match = line.match(rule.pattern);
      if (match) {
        hits.push({
          file: relative(process.cwd(), file),
          line: i + 1,
          found: match[0],
          why: rule.why,
        });
      }
    });
  }
}

// The directories above are skipped because they are meant to be untracked.
// That assumption is worth testing: a stray `git add -A` on a branch that
// predates the .gitignore entry commits them to a public repository, and the
// content scan would never look. Ask git what is actually tracked.
const tracked = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter((p) => p.startsWith('deprecated/') || p.startsWith('.claude/'));

if (tracked.length > 0) {
  console.error(`leakage check: ${tracked.length} local-only file(s) are tracked.\n`);
  for (const p of tracked.slice(0, 10)) console.error(`  ${p}`);
  if (tracked.length > 10) console.error(`  … and ${tracked.length - 10} more`);
  console.error('\n  These directories are gitignored because they must not be published.');
  console.error('  Untrack them with `git rm -r --cached <dir>` before committing.');
  process.exit(1);
}

if (hits.length === 0) {
  console.log(`leakage check: ${files.length} files scanned, clean. No local-only files tracked.`);
  process.exit(0);
}

console.error(`leakage check: ${hits.length} occurrence(s) of internal vocabulary.\n`);
for (const h of hits) {
  console.error(`  ${h.file}:${h.line}  "${h.found}" — ${h.why}`);
}
console.error('\n  Restate the mechanism inline. If provenance matters, "an internal');
console.error('  decision record, dated X" is the most that may be said.');
process.exit(1);
