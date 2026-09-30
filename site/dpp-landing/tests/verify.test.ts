// verify.test.ts — the browser verifier against the engine's own verdicts.
//
// public/verify/examples/ holds dossiers built with dpp-engine's own types and
// Ed25519 signing; verify-expected.json holds what dpp-vault's
// `verify_dossier_json` said about each one. Both are byte-identical to
// ops/demo/dossiers on dpp-engine main as of #431 (2026-09-30). This
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
import { b64urlDecode, jcs } from "../src/lib/verify/canonical.ts";

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

// RFC 8785 §3.2.3 sorts object keys by UTF-16 code unit, not by code point and
// not by UTF-8 byte. The three agree for almost every key, so a verifier that
// sorts the wrong way passes almost everything, and the golden verdicts above
// would only report it as a bad signature. The engine's canonicalisation dossier
// carries a pair on which they disagree (engine #429): "😀" is the surrogate
// pair 0xD83D 0xDE00 and "Ａ" (fullwidth A) the single unit 0xFF21, so by code
// unit the emoji comes first and by code point it comes last. That dossier, 11,
// is not a passport and the page never offers it as one; the example passports
// carry only what a real battery passport carries (engine #431).
//
// This reads the signed bytes themselves, which is what the page checks, not
// the readable copies beside them (see the next test for those).
test("keys are canonicalised by UTF-16 code unit, as the engine signed them", () => {
  assert.equal(jcs({ "Ａ": 6, "😀": 5 }), '{"😀":5,"Ａ":6}');
  const dossier = JSON.parse(readFileSync(`${dir}11-canonicalisation-vectors.json`, "utf8"));
  const signed = new TextDecoder().decode(b64urlDecode(dossier.fullView.jws.split(".")[1]));
  assert.ok(signed.indexOf('"😀"') < signed.indexOf('"Ａ"'), "the engine signed the emoji first");
  assert.equal(jcs(JSON.parse(signed)), signed, "canonicalising the signed payload again reproduces its bytes");
});

// A dossier carries each signed view twice: the JWS, and a readable copy of its
// payload that the page shows when an example is loaded. The node used to write
// the readable copies in code-point order (a serde_json map sorts by UTF-8
// bytes), so on the pair above they disagreed with the signed bytes and read as
// the very ordering bug the pair exists to catch (dpp-engine #430). The engine
// now writes every object in signed key order (dpp-engine #431), and these
// examples are its regenerated corpus, byte for byte. Order changes no verdict,
// since the page canonicalises before it checks anything; this fails if a
// re-copy from an engine without that fix brings code-point order back.
test("every object in the examples lists its keys in the order they are signed in", () => {
  const unordered: string[] = [];
  const walk = (value: unknown, at: string): void => {
    if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${at}[${i}]`));
    if (!value || typeof value !== "object") return;
    const keys = Object.keys(value);
    // An integer-like key is listed first by any JavaScript object whatever the
    // file says, so an object holding one cannot be read for order here.
    if (!keys.some((k) => /^(0|[1-9]\d*)$/.test(k)) && keys.join("\u0000") !== [...keys].sort().join("\u0000")) {
      unordered.push(at);
    }
    for (const k of keys) walk((value as Record<string, unknown>)[k], `${at}.${k}`);
  };
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    walk(JSON.parse(readFileSync(`${dir}${file}`, "utf8")), file);
  }
  assert.deepEqual(unordered, [], "objects whose keys are not in UTF-16 code-unit order");
});

test("an integer beyond 2^53 is refused, not approximated", async () => {
  const raw = readFileSync(`${dir}01-valid-simple.json`, "utf8");
  const text = raw.replace('"expectedLifetimeCycles": 1200', '"expectedLifetimeCycles": 9007199254740993');
  // An edit that finds nothing leaves a valid dossier behind, and the test
  // would then fail for the wrong reason, or pass for one after a corpus change.
  assert.notEqual(text, raw, "01 carries the integer this test enlarges");
  const got = await verifyDossierText(text);
  assert.equal(got.kind, "unsupported");
});
