// Vendor the product-group manifests from the sibling dpp-core repo.
//
// The copies under src/data/product-groups/ are committed so a build works
// without dpp-core checked out alongside. That convenience is also the hazard:
// a vendored file drifts silently, and the drift is published.
//
//   pnpm run sync:product-groups     copy core -> src/data/, record the commit
//   pnpm run check:product-groups    compare only, fail on drift or absent source
//
// Both modes exit non-zero when the source cannot be read. A sync that did not
// sync is a failure, not a notice.
//
// This mirrors site/dpp-docs/scripts/sync-openapi.mjs deliberately, including
// why it compares against a pinned commit rather than core's main branch:
// comparing against another repository's moving state makes this repository's
// CI depend on it, so an unrelated merge there turns pull requests red here,
// and a correction that must land in both deadlocks on which merges first.
//
// WHAT IS VENDORED, AND WHAT IS NOT
//
// Product-group manifests only. They carry no law — act numbers, dates and
// passport obligations live in the instrument manifests, which stay in core. A
// page built from these can say what the software models without making a
// regulatory claim this repository would then have to keep current.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const coreDir =
  process.env.DPP_CORE_DIR ?? fileURLToPath(new URL('../../../../dpp-core', import.meta.url));
const pinPath = `${root}product-groups-source.json`;
const destDir = `${root}src/data/product-groups`;

const pin = JSON.parse(readFileSync(pinPath, 'utf8'));
const srcDir = `${coreDir}/${pin.path}`;

const checkOnly = process.argv.includes('--check');

// Git normalises to LF on commit, but a Windows working copy is CRLF. Compare
// content, not line terminators, or the check fails on every developer machine.
const normalise = (text) => text.replace(/\r\n/g, '\n');

function fail(...lines) {
  for (const l of lines) console.error(l);
  process.exit(1);
}

/** Read one manifest out of core's git history at the pinned commit. */
function atPin(name) {
  try {
    return execFileSync('git', ['show', `${pin.commit}:${pin.path}/${name}`], {
      cwd: coreDir,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

if (!existsSync(coreDir)) {
  fail(
    `Cannot read ${coreDir}.`,
    `Check out dpp-core beside this repository, or set DPP_CORE_DIR.`,
  );
}

// The set of manifests is taken from the PIN, not from whatever happens to be
// on disk now. Listing the working tree would let a manifest added upstream
// appear here without the pin moving, which is the drift this file exists to
// prevent.
let names;
try {
  names = execFileSync('git', ['ls-tree', '--name-only', `${pin.commit}:${pin.path}`], {
    cwd: coreDir,
    encoding: 'utf8',
  })
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.endsWith('.json'))
    .sort();
} catch {
  fail(
    `Cannot list ${pin.path} at commit ${pin.commit} in ${coreDir}.`,
    `Fetch dpp-core so the pinned commit is present, or correct the "commit" field in product-groups-source.json.`,
  );
}

// 🚨 A loop over an empty list succeeds. A sync that vendored nothing, or a
// check that compared nothing, must not report success — that is the same
// vacuous pass this project has found in four other gates.
if (!names.length) {
  fail(`No manifests found at ${pin.path} in commit ${pin.commit}. Nothing was ${checkOnly ? 'checked' : 'synced'}.`);
}

if (!checkOnly) mkdirSync(destDir, { recursive: true });

const drifted = [];
const missing = [];

for (const name of names) {
  const source = atPin(name);
  if (source === null) {
    missing.push(name);
    continue;
  }
  const dest = `${destDir}/${name}`;
  if (checkOnly) {
    if (!existsSync(dest)) {
      drifted.push(`${name} (not vendored)`);
      continue;
    }
    if (normalise(readFileSync(dest, 'utf8')) !== normalise(source)) drifted.push(name);
  } else {
    writeFileSync(dest, source);
  }
}

if (missing.length) {
  fail(`Missing at the pinned commit: ${missing.join(', ')}`);
}

// A vendored file with no counterpart upstream is drift too, and in the
// direction a comparison loop over the source list cannot see.
if (checkOnly && existsSync(destDir)) {
  const extra = readdirSync(destDir)
    .filter((n) => n.endsWith('.json'))
    .filter((n) => !names.includes(n));
  for (const n of extra) drifted.push(`${n} (vendored, absent upstream)`);
}

if (checkOnly) {
  if (drifted.length) {
    fail(
      `Vendored product-group manifests differ from ${pin.repository} at ${pin.commit}:`,
      ...drifted.map((d) => `  ${d}`),
      ``,
      `Run: pnpm run sync:product-groups`,
      `If core has moved on purpose, bump "commit" in product-groups-source.json first.`,
    );
  }
  console.log(`OK: ${names.length} product-group manifest(s) match ${pin.repository} at ${pin.commit.slice(0, 8)}.`);
} else {
  const stamp = { ...pin };
  writeFileSync(pinPath, `${JSON.stringify(stamp, null, 2)}\n`);
  console.log(`Vendored ${names.length} product-group manifest(s) from ${pin.commit.slice(0, 8)}.`);
}
