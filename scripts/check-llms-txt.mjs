#!/usr/bin/env node
// Verify every on-site URL in an llms.txt corresponds to a page that was
// actually built.
//
// WHY THIS EXISTS
//
// `llms.txt` is a hand-written index whose entire value is being accurate: it
// tells a machine which pages are worth reading, and a model that follows a
// dead link learns nothing and may report the page as missing. Nothing else
// checks it — it is a static file in `public/`, so no build step parses it and
// no link checker reaches it.
//
// It went wrong immediately. The first version of the landing file listed
// `/trust/`, which is `_trust.astro` on `main` — an underscore-prefixed draft
// that Astro deliberately does not build. The link was written from a listing
// taken on a different branch, where the page is published.
//
// This compares each URL against `dist/`, so it answers the only question that
// matters: does the page exist in the artifact being deployed.
//
// Usage: node scripts/check-llms-txt.mjs <site-dir> <origin>
//   e.g. node scripts/check-llms-txt.mjs site/dpp-landing https://odal-node.io

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const [siteDir, origin] = process.argv.slice(2);
if (!siteDir || !origin) {
  console.error("usage: check-llms-txt.mjs <site-dir> <origin>");
  process.exit(2);
}

const llmsPath = join(siteDir, "public", "llms.txt");
if (!existsSync(llmsPath)) {
  console.error(`FAIL: ${llmsPath} does not exist`);
  process.exit(1);
}

const dist = join(siteDir, "dist");
if (!existsSync(dist)) {
  console.error(`FAIL: ${dist} does not exist — build before running this`);
  process.exit(1);
}

const text = readFileSync(llmsPath, "utf8");
const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const urls = [...text.matchAll(new RegExp(`${escaped}(/[^)\\s]*)`, "g"))].map((m) => m[1]);

// 🚨 A file listing no on-site pages is not a passing file. This whole script
// is a loop, and a loop over nothing succeeds — the exact failure mode it is
// meant to catch elsewhere.
if (urls.length === 0) {
  console.error(`FAIL: no ${origin} URLs found in ${llmsPath} — nothing was checked`);
  process.exit(1);
}

const missing = [];
for (const url of urls) {
  const rel = url.replace(/^\/|\/$/g, "");
  const candidates = rel === ""
    ? [join(dist, "index.html")]
    : [join(dist, rel, "index.html"), join(dist, `${rel}.html`)];
  if (!candidates.some(existsSync)) missing.push(url);
}

if (missing.length > 0) {
  console.error(`FAIL: ${missing.length} URL(s) in ${llmsPath} were not built:`);
  for (const m of missing) console.error(`  ${origin}${m}`);
  console.error("\nEither the page is a draft (an `_`-prefixed file is not built)");
  console.error("or the path is wrong. Do not ship an index that points at nothing.");
  process.exit(1);
}

console.log(`OK: all ${urls.length} on-site URL(s) in ${llmsPath} were built.`);
