#!/usr/bin/env node
// Verify a built XML sitemap lists exactly the pages a search engine should
// index, each under its own canonical address and with a <lastmod>.
//
// WHY THIS EXISTS
//
// A sitemap is read by crawlers and by nobody else, so nothing on the site
// shows when it is wrong. Three ways it goes wrong quietly:
//
// - A page is missing, or a redirect stub or a noindex page is listed. The
//   docs build 18 redirect stubs for renamed pages; listing one asks a crawler
//   to index a page that says "go elsewhere".
// - A listed address differs from the page's own canonical (a trailing slash,
//   another host), so the crawler is told two things about one page. The API
//   reference sits outside Starlight and had no canonical at all.
// - <lastmod> disappears. It comes from git (scripts/git-lastmod.mjs), and a
//   shallow clone with no way to fetch history drops it. The sitemap stays
//   valid XML, so only a check like this notices.
//
// This reads dist/, so it answers what the deployed artifact says.
//
// Usage: node scripts/check-sitemaps.mjs <site-dir> <origin>
//   e.g. node scripts/check-sitemaps.mjs site/dpp-docs https://docs.odal-node.io

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const [siteDir, origin] = process.argv.slice(2);
if (!siteDir || !origin) {
  console.error("usage: check-sitemaps.mjs <site-dir> <origin>");
  process.exit(2);
}

const dist = join(siteDir, "dist");
const indexPath = join(dist, "sitemap-index.xml");
if (!existsSync(indexPath)) {
  console.error(`FAIL: ${indexPath} does not exist — build before running this`);
  process.exit(1);
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const failures = [];

// Every <url> in every child sitemap, with its <lastmod>.
const entries = [];
for (const child of locs(readFileSync(indexPath, "utf8"))) {
  const file = join(dist, new URL(child).pathname);
  if (!existsSync(file)) {
    failures.push(`sitemap index lists ${child}, which was not built`);
    continue;
  }
  for (const m of readFileSync(file, "utf8").matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    entries.push({
      loc: (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1],
      lastmod: (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1],
    });
  }
}

// Every built page, and whether it may be indexed.
const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".html") ? [join(d, e.name)] : [],
  );
const pages = new Map();
for (const f of walk(dist)) {
  const path = "/" + relative(dist, f).split(sep).join("/").replace(/index\.html$/, "");
  if (path === "/404.html") continue;
  const html = readFileSync(f, "utf8");
  pages.set(path, {
    canonical: (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1],
    indexable: !/name="robots" content="[^"]*noindex/.test(html) && !/http-equiv="refresh"/.test(html),
  });
}

const seen = new Set();
const now = Date.now();
for (const { loc, lastmod } of entries) {
  if (!loc?.startsWith(origin + "/")) {
    failures.push(`${loc}: not on ${origin}`);
    continue;
  }
  if (seen.has(loc)) failures.push(`${loc}: listed twice`);
  seen.add(loc);
  const path = new URL(loc).pathname;
  const page = pages.get(path);
  if (!page) failures.push(`${loc}: no page was built there`);
  else if (!page.indexable) failures.push(`${loc}: listed, but the page is a redirect or noindex`);
  else if (page.canonical !== loc) failures.push(`${loc}: the page's canonical is ${page.canonical ?? "missing"}`);
  if (!lastmod) failures.push(`${loc}: no <lastmod> (was the build's git history shallow?)`);
  else if (Number.isNaN(Date.parse(lastmod)) || Date.parse(lastmod) > now) failures.push(`${loc}: bad <lastmod> ${lastmod}`);
}
for (const [path, page] of pages) {
  if (page.indexable && !seen.has(origin + path)) failures.push(`${origin}${path}: indexable page missing from the sitemap`);
}

if (failures.length) {
  console.error(`FAIL: ${dist} sitemap, ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
const dates = new Set(entries.map((e) => e.lastmod.slice(0, 10)));
console.log(`OK: ${entries.length} URL(s) in ${dist} sitemap, every indexable page, canonicals match, ${dates.size} distinct <lastmod> date(s).`);
