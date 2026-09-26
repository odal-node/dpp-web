#!/usr/bin/env node
// Install the rate limit that protects /verify, as a Cloudflare rate-limiting
// rule on the odal-node.io zone.
//
// WHY AT THE EDGE, AND WHY THIS SCRIPT
//
// The site is static on Cloudflare Pages; /verify checks files in the browser,
// so there is no server of ours to put a limiter in. The limit has to sit in
// front of Pages, at Cloudflare's edge. Pages Functions cannot do it: they do
// not support Cloudflare's rate-limiting binding, and a hand-rolled counter in
// KV is eventually consistent (it undercounts a burst) while billing a
// Functions invocation for every request it inspects, which is the flood it is
// meant to stop. A zone rule costs nothing per request and runs before Pages.
//
// The zone is not managed as code anywhere else yet, so this script is the
// rule's source of truth: it reads
// the zone's rate-limiting ruleset, replaces only the rule it owns (matched by
// its `ref`), keeps every other rule, and writes the result back.
//
// THE RULE, WITHIN THE FREE PLAN
//
// Free allows one rate-limiting rule, a 10-second period, a 10-second
// mitigation timeout, counting by IP, and only the request path in the
// expression, so the rule cannot name a host. Matching paths that *start with*
// /verify keeps it off every other host in the zone: the docs have no such
// path, and a node's `/vault/api/v1/evidence/verify` only contains it. One
// visit to /verify is the page and at most five example files, so 20 requests
// in 10 seconds from one address is well above any person and well below a
// flood. Past it, that address is answered 429 for 10 seconds.
//
// It applies to the custom domain only. `*.pages.dev` hostnames are not in
// this zone, so staging previews are not covered.
//
// Usage (dry run by default; prints the ruleset it would write):
//   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ZONE_ID=… node scripts/cloudflare-rate-limit.mjs
//   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ZONE_ID=… node scripts/cloudflare-rate-limit.mjs --apply
//
// The token needs the zone permission "Zone WAF: Edit". The token the deploy
// workflow uses for cache purges does not have it.

import { pathToFileURL } from "node:url";

export const RULE_REF = "odal-verify-rate-limit";

export const verifyRule = {
  ref: RULE_REF,
  description: "odal-node.io /verify: 20 requests per 10 s per IP, then 429 for 10 s (scripts/cloudflare-rate-limit.mjs)",
  expression: 'starts_with(http.request.uri.path, "/verify")',
  action: "block",
  ratelimit: {
    // Cloudflare requires the data-centre id beside the client characteristic.
    characteristics: ["cf.colo.id", "ip.src"],
    period: 10,
    requests_per_period: 20,
    mitigation_timeout: 10,
  },
  enabled: true,
};

/**
 * The rules to write: every existing rule except ours, then ours. Server-owned
 * fields (id, version, last_updated) are dropped from the kept rules, because
 * the entry-point write takes rule definitions, not stored records.
 */
export function mergeRules(existing = [], rule = verifyRule) {
  const strip = ({ id, version, last_updated, ...definition }) => definition;
  return [...existing.filter((r) => r.ref !== rule.ref).map(strip), rule];
}

async function api(method, path, token, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  const apply = process.argv.includes("--apply");
  if (!token || !zone) {
    console.error("rate limit: set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID.");
    process.exit(2);
  }

  const entrypoint = `/zones/${zone}/rulesets/phases/http_ratelimit/entrypoint`;
  const current = await api("GET", entrypoint, token);
  // No entry point yet is a 404 and means no rules; anything else is a failure.
  if (current.status !== 200 && current.status !== 404) {
    console.error(`rate limit: reading the zone's rate-limiting rules failed (HTTP ${current.status}):`);
    console.error(JSON.stringify(current.json.errors ?? current.json, null, 2));
    process.exit(1);
  }
  const existing = current.status === 200 ? current.json.result?.rules ?? [] : [];
  const rules = mergeRules(existing);

  const others = rules.length - 1;
  console.log(`rate limit: ${existing.some((r) => r.ref === RULE_REF) ? "replacing" : "adding"} ${RULE_REF}; keeping ${others} other rule(s).`);
  if (others > 0) console.log("rate limit: the Free plan allows one rate-limiting rule; writing two will be refused.");
  console.log(JSON.stringify({ rules }, null, 2));

  if (!apply) {
    console.log("rate limit: dry run. Re-run with --apply to write it.");
    return;
  }
  const written = await api("PUT", entrypoint, token, { rules });
  if (written.status !== 200 || !written.json.success) {
    console.error(`rate limit: writing the rules failed (HTTP ${written.status}):`);
    console.error(JSON.stringify(written.json.errors ?? written.json, null, 2));
    process.exit(1);
  }
  console.log(`rate limit: written. The zone's rate-limiting ruleset is at version ${written.json.result?.version}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
