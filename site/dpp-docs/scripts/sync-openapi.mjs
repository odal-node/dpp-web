// Vendor the canonical OpenAPI spec from the sibling dpp-engine repo into public/.
//
// The copy at public/openapi.yaml is committed so a build works without
// dpp-engine checked out alongside. That convenience is also the hazard: a
// vendored file drifts silently, and the drift is published.
//
//   pnpm run sync:openapi     copy engine -> public/, and record what it came from
//   pnpm run check:openapi    compare only, fail on drift or on an absent source
//
// Both modes exit non-zero when the source cannot be read. A sync that did not
// sync is a failure, not a notice — an earlier version of this script warned
// and exited 0 in that case, so it could not report a problem through any path.
//
// WHY THIS COMPARES AGAINST A PINNED COMMIT, NOT AGAINST THE ENGINE'S MAIN
//
// Comparing against whatever is currently on the engine's main branch makes
// this repository's CI depend on another repository's moving state. Two things
// go wrong. An unrelated merge in the engine turns pull requests red here, for
// reasons that have nothing to do with the change under review. And a
// correction that must land in both repositories deadlocks: the web side cannot
// go green until the engine side merges, so neither can be reviewed on a green
// build.
//
// openapi-source.json records the exact commit the vendored copy came from.
// The check reads the spec at that commit, so it is deterministic and
// self-contained. Bumping the pin is then a deliberate, reviewable line in a
// diff — which is also what makes the vendored copy's provenance auditable.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const engineDir =
  process.env.DPP_ENGINE_DIR ?? fileURLToPath(new URL('../../../../dpp-engine', import.meta.url));
const pinPath = `${root}openapi-source.json`;
const dest = `${root}public/openapi.yaml`;

const pin = JSON.parse(readFileSync(pinPath, 'utf8'));
const src = `${engineDir}/${pin.path}`;

const checkOnly = process.argv.includes('--check');

// Git normalises to LF on commit, but a Windows working copy is CRLF. Compare
// content, not line terminators, or the check fails on every developer machine.
const normalise = (text) => text.replace(/\r\n/g, '\n');

const fail = (message) => {
  console.error(`openapi ${checkOnly ? 'check' : 'sync'}: ${message}`);
  process.exit(1);
};

const git = (...args) =>
  execFileSync('git', ['-C', engineDir, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

if (!existsSync(engineDir)) {
  fail(
    `cannot find the engine repository at ${engineDir}\n` +
      '  Check out dpp-engine beside this repo, or set DPP_ENGINE_DIR to its location.',
  );
}

if (checkOnly) {
  if (!existsSync(dest)) fail(`vendored copy missing at ${dest}`);

  let pinned;
  try {
    pinned = git('show', `${pin.commit}:${pin.path}`);
  } catch {
    fail(
      `cannot read ${pin.path} at commit ${pin.commit}\n` +
        `  That commit is not present in ${engineDir}. Fetch it, or correct the\n` +
        `  "commit" field in openapi-source.json.`,
    );
  }

  if (normalise(pinned) === normalise(readFileSync(dest, 'utf8'))) {
    console.log(`openapi check: vendored copy matches ${pin.repository}@${pin.commit.slice(0, 9)}.`);
    process.exit(0);
  }

  fail(
    `the vendored copy does not match ${pin.repository}@${pin.commit.slice(0, 9)}.\n` +
      '  Either it was edited by hand — it must not be, it is a copy — or the pin\n' +
      '  is wrong. Run `pnpm run sync:openapi` and commit both files together.',
  );
}

if (!existsSync(src)) fail(`cannot read ${src}`);

copyFileSync(src, dest);

// Record what was copied. Without this the vendored file has no provenance and
// the check above has nothing to verify against.
const head = git('rev-parse', 'HEAD').trim();
writeFileSync(pinPath, `${JSON.stringify({ ...pin, commit: head }, null, 2)}\n`);

console.log(`openapi sync: ${src} -> ${dest}`);
console.log(`openapi sync: pinned to ${pin.repository}@${head.slice(0, 9)}`);
