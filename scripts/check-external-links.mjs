// Check every link from the built sites to somewhere else: EUR-Lex acts,
// GitHub files, standards bodies.
//
// check-links.mjs holds internal links to the build, on every pull request.
// External links cannot be held that way: whether a third-party page answers
// is not a property of the pull request, and a host that is briefly down, or
// refuses automated requests, would redden unrelated work. So this runs on a
// schedule (.github/workflows/external-links.yml) and fails only on a link
// that is certainly gone:
//
//   * broken — the host answered 404 or 410. The page is not there.
//   * unsure — anything else that is not a success: 401/403 (many hosts refuse
//     robots), 429, 5xx, a timeout, a network error. Listed, never failed on,
//     because each says more about the host or the runner than about the link.
//
// Usage: node scripts/check-external-links.mjs   (after `pnpm -r build`)
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { pathToFileURL } from "node:url";

const SITES = [
  { origin: "https://odal-node.io", dist: "site/dpp-landing/dist" },
  { origin: "https://docs.odal-node.io", dist: "site/dpp-docs/dist" },
];

/** Links in a page that leave both sites. Commented-out links are not published. */
export function externalLinks(html, ownOrigins) {
  const out = new Set();
  const live = html.replace(/<!--[\s\S]*?-->/g, "");
  for (const [, href] of live.matchAll(/<a\b[^>]*\shref="(https?:\/\/[^"]+)"/g)) {
    const url = href.replace(/&amp;/g, "&");
    const { origin } = new URL(url);
    if (ownOrigins.includes(origin) || origin.endsWith(".pages.dev")) continue;
    out.add(url.split("#")[0]);
  }
  return out;
}

/** What an answer (or a failure to get one) says about a link. */
export function classify(result) {
  if (typeof result !== "number") return "unsure";
  if (result >= 200 && result < 400) return "ok";
  if (result === 404 || result === 410) return "broken";
  return "unsure";
}

/** One GET, redirects followed, body discarded. A status, or an Error. */
export async function fetchStatus(url, { timeoutMs = 20000, fetchImpl = fetch } = {}) {
  try {
    const res = await fetchImpl(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "odal-node-link-check (+https://github.com/odal-node/dpp-web)" },
    });
    await res.body?.cancel();
    return res.status;
  } catch (e) {
    return e instanceof Error ? e : new Error(String(e));
  }
}

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (extname(full) === ".html") out.push(full);
  }
  return out;
};

async function main() {
  const own = SITES.map((s) => s.origin);
  const pagesByUrl = new Map();
  for (const site of SITES) {
    if (!existsSync(site.dist)) {
      console.error(`external links: ${site.dist} not found — run \`pnpm -r build\` first.`);
      process.exit(1);
    }
    for (const file of walk(site.dist)) {
      for (const url of externalLinks(readFileSync(file, "utf8"), own)) {
        if (!pagesByUrl.has(url)) pagesByUrl.set(url, []);
        pagesByUrl.get(url).push(relative(process.cwd(), file));
      }
    }
  }

  // A few at a time, so no host sees a burst from one address.
  const urls = [...pagesByUrl.keys()].sort();
  const results = new Map();
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++];
      let result = await fetchStatus(url);
      // One retry for anything short of a clear answer, after a pause.
      if (classify(result) === "unsure") {
        await new Promise((r) => setTimeout(r, 3000));
        result = await fetchStatus(url);
      }
      results.set(url, result);
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));

  const show = (r) => (typeof r === "number" ? `HTTP ${r}` : r.message);
  const by = (kind) => urls.filter((u) => classify(results.get(u)) === kind);
  const broken = by("broken");
  const unsure = by("unsure");
  console.log(`external links: ${urls.length} checked, ${urls.length - broken.length - unsure.length} ok, ${unsure.length} unsure, ${broken.length} broken.`);
  for (const u of unsure) console.log(`  unsure  ${u}  (${show(results.get(u))})`);
  for (const u of broken) {
    const pages = pagesByUrl.get(u);
    console.error(`  BROKEN  ${u}  (${show(results.get(u))}) <- ${pages.length} page(s)`);
    for (const p of pages.slice(0, 4)) console.error(`      ${p}`);
    if (pages.length > 4) console.error(`      … and ${pages.length - 4} more`);
  }
  process.exit(broken.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
