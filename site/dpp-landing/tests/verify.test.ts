// verify.test.ts — the browser verifier against the engine's own verdicts.
//
// public/verify/examples/ holds dossiers built with dpp-engine's own types and
// Ed25519 signing; verify-expected.json holds what dpp-vault's
// `verify_dossier_json` said about each one (engine #423, 2026-09-28). This
// test fails if the TypeScript verifier disagrees with the Rust one on the
// outcome or on any single check. A second implementation that is not held to
// the first is two verifiers that will disagree one day without anyone
// noticing; this is what notices.
//
// Run: pnpm --filter dpp-landing run test:verify
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { verifyDossierText } from "../src/lib/verify/verify.ts";

type Expected =
  | { exit: 0 | 1; checks: { name: string; status: "pass" | "fail" | "absent" }[] }
  | { exit: 2; error: string };

const dir = fileURLToPath(new URL("../public/verify/examples/", import.meta.url));
const expected: Record<string, Expected> = JSON.parse(
  readFileSync(fileURLToPath(new URL("./verify-expected.json", import.meta.url)), "utf8"),
);

// 🚨 A loop over an empty directory passes. The corpus must be there.
const files = readdirSync(dir).sort();
test("the golden corpus is present and fully described", () => {
  assert.ok(files.length >= 10, `expected at least 10 example dossiers, found ${files.length}`);
  assert.deepEqual(files, Object.keys(expected).sort());
});

for (const file of files) {
  test(`agrees with the engine on ${file}`, async () => {
    const want = expected[file];
    const got = await verifyDossierText(readFileSync(`${dir}${file}`, "utf8"));
    if (want.exit === 2) {
      assert.equal(got.kind, "malformed", `the engine refused ${file} as malformed: ${want.error}`);
      return;
    }
    assert.equal(got.kind, "report", `the engine produced a report for ${file}`);
    if (got.kind !== "report") return;
    assert.equal(got.exit, want.exit, "overall verdict");
    assert.deepEqual(
      got.checks.map((c) => `${c.name}:${c.status}`),
      want.checks.map((c) => `${c.name}:${c.status}`),
      "every named check, in order",
    );
  });
}

// The page's own claim: a single changed character in a signed member is
// caught, and caught precisely. The edit goes into the full view, so exactly
// the full view's signature and the content hashes fail; the public view,
// untouched, still verifies. It is aimed there on purpose: the `published`
// history entry records the same payload, as a node's does, and comes first in
// the file, so the first occurrence of the model id is not in the full view.
test("a one-character edit to a signed payload is caught, and only where it happened", async () => {
  const raw = readFileSync(`${dir}04-valid-full-lifecycle.json`, "utf8");
  const at = raw.indexOf('"fullView":');
  assert.ok(at > 0, "04 has a full view");
  const text = raw.slice(0, at) + raw.slice(at).replace('"ACME-LMT-48V"', '"ACME-LMT-49V"');
  const got = await verifyDossierText(text);
  assert.equal(got.kind, "report");
  if (got.kind === "report") {
    assert.equal(got.exit, 1);
    const failed = got.checks.filter((c) => c.status === "fail").map((c) => c.name);
    assert.deepEqual(failed, ["content_integrity", "full_view_signature"]);
  }
});

test("an integer beyond 2^53 is refused, not approximated", async () => {
  const text = readFileSync(`${dir}01-valid-simple.json`, "utf8").replace('"ratedCapacityAh": 20', '"ratedCapacityAh": 9007199254740993');
  const got = await verifyDossierText(text);
  assert.equal(got.kind, "unsupported");
});
