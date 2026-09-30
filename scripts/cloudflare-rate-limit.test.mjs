// Tests for scripts/cloudflare-rate-limit.mjs: the rule stays inside what the
// Free plan accepts, and a write never removes a rule it does not own.
//
// Run: pnpm run test:scripts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeRules, verifyRule, RULE_REF } from "./cloudflare-rate-limit.mjs";

test("the rule fits the Free plan", () => {
  assert.equal(verifyRule.ratelimit.period, 10);
  assert.equal(verifyRule.ratelimit.mitigation_timeout, 10);
  assert.deepEqual(verifyRule.ratelimit.characteristics, ["cf.colo.id", "ip.src"]);
  // Free rate-limiting expressions may use the request path only.
  assert.match(verifyRule.expression, /^starts_with\(http\.request\.uri\.path, "\/verify"\)$/);
});

test("the rule matches /verify and nothing that only contains it", () => {
  const prefix = /"([^"]+)"/.exec(verifyRule.expression)[1];
  const matches = (path) => path.startsWith(prefix);
  for (const path of ["/verify", "/verify/", "/verify/examples/04-valid-full-lifecycle.json"]) {
    assert.ok(matches(path), `should match ${path}`);
  }
  // A node's routes and the docs' verification guide only contain the word.
  for (const path of ["/vault/api/v1/evidence/verify", "/vault/api/v1/evidence/abc/verify", "/guides/verification/", "/"]) {
    assert.ok(!matches(path), `should not match ${path}`);
  }
});

test("an empty zone gets exactly our rule", () => {
  assert.deepEqual(mergeRules([]), [verifyRule]);
  assert.deepEqual(mergeRules(undefined), [verifyRule]);
});

test("other rules are kept, and ours is replaced rather than duplicated", () => {
  const other = { id: "a1", version: "3", last_updated: "2026-01-01", ref: "someone-else", expression: "true", action: "block" };
  const stale = { id: "b2", version: "1", ref: RULE_REF, expression: "old", action: "log" };
  const rules = mergeRules([other, stale]);
  assert.equal(rules.length, 2);
  assert.deepEqual(rules[0], { ref: "someone-else", expression: "true", action: "block" });
  assert.deepEqual(rules[1], verifyRule);
  assert.equal(rules.filter((r) => r.ref === RULE_REF).length, 1);
});
