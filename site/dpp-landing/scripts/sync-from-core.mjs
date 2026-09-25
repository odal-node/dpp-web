// Vendor data from the sibling dpp-core repo, at one pinned commit.
//
// The copies under src/data/ are committed so a build works without dpp-core
// checked out alongside. That convenience is also the hazard: a vendored file
// drifts silently, and the drift is published.
//
//   pnpm run sync:core     copy every source at the pinned commit
//   pnpm run check:core    compare only, fail on drift or an unreadable source
//
// The sources and the commit live in core-source.json. Both modes exit
// non-zero when a source cannot be read: a sync that did not sync is a
// failure, not a notice.
//
// This mirrors site/dpp-docs/scripts/sync-openapi.mjs deliberately, including
// why it compares against a pinned commit rather than core's main branch:
// comparing against another repository's moving state makes this repository's
// CI depend on it, so an unrelated merge there turns pull requests red here,
// and a correction that must land in both deadlocks on which merges first.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const coreDir =
  process.env.DPP_CORE_DIR ?? fileURLToPath(new URL('../../../../dpp-core', import.meta.url));
const pinPath = `${root}core-source.json`;
const pin = JSON.parse(readFileSync(pinPath, 'utf8'));
const checkOnly = process.argv.includes('--check');

// Git normalises to LF on commit, but a Windows working copy is CRLF. Compare
// content, not line terminators, or the check fails on every developer machine.
const normalise = (text) => text.replace(/\r\n/g, '\n');

function fail(...lines) {
  for (const l of lines) console.error(l);
  process.exit(1);
}

const git = (args) =>
  execFileSync('git', args, { cwd: coreDir, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

if (!existsSync(coreDir)) {
  fail(`Cannot read ${coreDir}.`, `Check out dpp-core beside this repository, or set DPP_CORE_DIR.`);
}

const sources = Object.entries(pin.sources ?? {});
// 🚨 A loop over an empty list succeeds. A config with no sources must not
// report success; that is the vacuous pass this project has found in other gates.
if (!sources.length) fail(`core-source.json names no sources. Nothing was ${checkOnly ? 'checked' : 'synced'}.`);

const drifted = [];
const report = [];

for (const [name, { path, dest }] of sources) {
  // The file list comes from the PIN, not the working tree: listing the working
  // tree would let a file added upstream appear here without the pin moving,
  // which is the drift this script exists to prevent.
  let files;
  try {
    files = git(['ls-tree', '--name-only', `${pin.commit}:${path}`])
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.endsWith('.json'))
      .sort();
  } catch {
    fail(
      `Cannot list ${path} at commit ${pin.commit} in ${coreDir}.`,
      `Fetch dpp-core so the pinned commit is present, or correct "commit" in core-source.json.`,
    );
  }
  if (!files.length) fail(`No JSON files at ${path} in commit ${pin.commit} (source "${name}").`);

  const destDir = `${root}${dest}`;
  if (!checkOnly) mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    const source = git(['show', `${pin.commit}:${path}/${file}`]);
    const target = `${destDir}/${file}`;
    if (!checkOnly) {
      writeFileSync(target, source);
    } else if (!existsSync(target)) {
      drifted.push(`${name}/${file} (not vendored)`);
    } else if (normalise(readFileSync(target, 'utf8')) !== normalise(source)) {
      drifted.push(`${name}/${file}`);
    }
  }

  // A vendored file with no counterpart upstream is drift too, and in the
  // direction a loop over the source list cannot see.
  if (checkOnly && existsSync(destDir)) {
    for (const extra of readdirSync(destDir).filter((n) => n.endsWith('.json') && !files.includes(n))) {
      drifted.push(`${name}/${extra} (vendored, absent upstream)`);
    }
  }
  report.push(`${files.length} ${name}`);
}

if (checkOnly && drifted.length) {
  fail(
    `Vendored files differ from ${pin.repository} at ${pin.commit}:`,
    ...drifted.map((d) => `  ${d}`),
    ``,
    `Run: pnpm run sync:core`,
    `If core has moved on purpose, bump "commit" in core-source.json first.`,
  );
}

console.log(
  `${checkOnly ? 'OK' : 'Vendored'}: ${report.join(', ')} ${checkOnly ? 'match' : 'from'} ${pin.repository} at ${pin.commit.slice(0, 8)}.`,
);
