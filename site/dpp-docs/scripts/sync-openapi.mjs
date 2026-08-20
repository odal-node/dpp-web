// Vendor the canonical OpenAPI spec from the sibling dpp-engine repo into public/.
//
// The copy at public/openapi.yaml is committed so a build works without
// dpp-engine checked out alongside. That convenience is also the hazard: a
// vendored file drifts silently, and the drift is published.
//
//   pnpm run sync:openapi     copy engine -> public/, fail if the source is absent
//   pnpm run check:openapi    compare only, fail on drift or on an absent source
//
// Both modes exit non-zero when the source cannot be read. A sync that did not
// sync is a failure, not a notice — the previous version of this script warned
// and exited 0 in that case, so it could not report a problem through any path.
//
// The engine directory can be pointed elsewhere with DPP_ENGINE_DIR; the default
// is the sibling checkout used on a development machine.
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const engineDir =
  process.env.DPP_ENGINE_DIR ?? fileURLToPath(new URL('../../../../dpp-engine', import.meta.url));
const src = `${engineDir}/api/openapi.yaml`;
const dest = `${root}public/openapi.yaml`;

const checkOnly = process.argv.includes('--check');

// Git normalises to LF on commit, but a Windows working copy is CRLF. Compare
// content, not line terminators, or the check fails on every developer machine.
const normalise = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const fail = (message) => {
  console.error(`openapi ${checkOnly ? 'check' : 'sync'}: ${message}`);
  process.exit(1);
};

if (!existsSync(src)) {
  fail(
    `cannot read ${src}\n` +
      '  The engine spec is the source of truth for the vendored copy. Check out\n' +
      '  dpp-engine beside this repo, or set DPP_ENGINE_DIR to its location.',
  );
}

if (checkOnly) {
  if (!existsSync(dest)) fail(`vendored copy missing at ${dest}`);
  if (normalise(src) === normalise(dest)) {
    console.log('openapi check: vendored copy matches the engine spec.');
    process.exit(0);
  }
  fail(
    'the vendored copy has drifted from the engine spec.\n' +
      '  Run `pnpm run sync:openapi` and commit the result.\n' +
      '  Publishing a stale spec documents endpoints and schemas the product no longer has.',
  );
}

copyFileSync(src, dest);
console.log(`openapi sync: ${src} -> ${dest}`);
