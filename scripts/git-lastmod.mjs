// git-lastmod.mjs — when a page's content last changed, for the sitemaps'
// <lastmod>. Each site maps its URLs to the files the page is built from
// (site/*/sitemap-sources.mjs); this reads the last commit that touched any of
// them.
//
// A search engine uses <lastmod> only while it stays honest: it must move when
// a page's content changes and stay put when it does not. The build time on
// every URL fails both, and a crawler then learns to ignore the field. So the
// date comes from git, never from the clock.
//
// A shallow clone knows a single commit, which would give every file the same
// date. When the checkout is shallow, this fetches the full history first
// (Cloudflare Pages and actions/checkout both clone shallow by default). If
// that fails, the sitemap is written without <lastmod> rather than with wrong
// ones, and the build says so.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const git = (args, cwd) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

let usable;
function fullHistory(cwd) {
  if (usable !== undefined) return usable;
  try {
    if (git(["rev-parse", "--is-shallow-repository"], cwd) === "true") {
      git(["fetch", "--unshallow", "--quiet"], cwd);
    }
    usable = git(["rev-parse", "--is-shallow-repository"], cwd) === "false";
  } catch {
    usable = false;
  }
  if (!usable) console.warn("[lastmod] no full git history here: the sitemap is written without <lastmod>.");
  return usable;
}

/**
 * The last commit date (ISO 8601) of any of `files`, which are paths relative
 * to `root` (files or directories). Undefined when none exists or git cannot
 * say, so the caller writes no <lastmod> instead of a guess.
 */
export function lastCommitDate(root, files) {
  if (!fullHistory(root)) return undefined;
  const existing = files.filter((f) => existsSync(path.join(root, f)));
  if (!existing.length) return undefined;
  try {
    return git(["log", "-1", "--format=%cI", "--", ...existing], root) || undefined;
  } catch {
    return undefined;
  }
}
