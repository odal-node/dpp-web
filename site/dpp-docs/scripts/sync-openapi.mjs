// Vendor the canonical OpenAPI spec from the sibling dpp-engine repo into public/.
//
// The copy at public/openapi.yaml is committed so a build works without
// dpp-engine checked out alongside. That convenience is also the hazard: a
// vendored file drifts silently, and the drift is published.
//
//   pnpm run sync:openapi     copy the spec at the latest engine release into
//                             public/, and record its tag and commit
//   pnpm run check:openapi    compare only, fail on drift or on an absent source
//
// Both modes exit non-zero when the source cannot be read. A sync that did not
// sync is a failure, not a notice — an earlier version of this script warned
// and exited 0 in that case, so it could not report a problem through any path.
//
// WHICH RELEASE IS PINNED: THE LATEST ONE, NOT THE ENGINE'S MAIN
//
// The API reference describes what an operator can run, and its version label
// must match its content. The engine's main branch carries work that is in no
// release, so a sync copies the spec at the highest vX.Y.Z tag, by version
// order. Pre-releases count: the engine marks its pre-1.0 releases as GitHub
// pre-releases, and GitHub's "latest release" skips them. DPP_ENGINE_REF names a
// tag to pin deliberately instead.
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
// openapi-source.json records the exact tag and commit the vendored copy came from.
// The check reads the spec at that commit, so it is deterministic and
// self-contained. Bumping the pin is then a deliberate, reviewable line in a
// diff — which is also what makes the vendored copy's provenance auditable.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const engineDir =
  process.env.DPP_ENGINE_DIR ?? fileURLToPath(new URL('../../../../dpp-engine', import.meta.url));
const pinPath = `${root}openapi-source.json`;
const dest = `${root}public/openapi.yaml`;

const pin = JSON.parse(readFileSync(pinPath, 'utf8'));

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

// git() for a probe that may fail: null instead of an exception.
const tryGit = (...args) => {
  try {
    return git(...args);
  } catch {
    return null;
  }
};

// Raw bytes of a git object, so a copy matches the blob exactly.
const gitBytes = (...args) =>
  execFileSync('git', ['-C', engineDir, ...args], { maxBuffer: 32 * 1024 * 1024 });

const RELEASE_TAG = /^v\d+\.\d+\.\d+$/;

// The newest release tag by version order, pre-releases included (see the header).
const latestReleaseTag = () => {
  const tags = tryGit('tag', '--list', 'v*', '--sort=-version:refname');
  if (tags === null) fail(`cannot list the tags of ${engineDir}`);
  const release = tags.split('\n').find((tag) => RELEASE_TAG.test(tag));
  if (release === undefined) fail(`no release tag (vX.Y.Z) in ${engineDir}`);
  return release;
};

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

// DPP_ENGINE_REF names the tag to pin on purpose. Unset, the latest release is used.
const ref = process.env.DPP_ENGINE_REF || latestReleaseTag();
if (tryGit('show-ref', '--verify', '--quiet', `refs/tags/${ref}`) === null) {
  fail(`no tag named ${ref} in ${engineDir}`);
}

const commit = git('rev-list', '-n', '1', `refs/tags/${ref}`).trim();

// Read the spec out of the tag's tree, not the engine's working tree, so the
// checkout's branch does not matter.
let spec;
try {
  spec = gitBytes('show', `refs/tags/${ref}:${pin.path}`);
} catch {
  fail(`cannot read ${pin.path} at ${ref}\n  That tag has no such file.`);
}
writeFileSync(dest, spec);

// Record what was copied. Without this the vendored file has no provenance and
// the check above has nothing to verify against.
writeFileSync(pinPath, `${JSON.stringify({ ...pin, tag: ref, commit }, null, 2)}\n`);

console.log(`openapi sync: ${pin.repository}@${ref}:${pin.path} -> ${dest}`);
console.log(`openapi sync: pinned to ${pin.repository}@${ref} (${commit.slice(0, 9)})`);
