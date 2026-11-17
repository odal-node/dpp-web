// sitemap-sources.mjs — which files each page's content comes from, so the
// sitemap's <lastmod> moves when that content changes (scripts/git-lastmod.mjs).
//
// A docs page is its own content file under src/content/docs. The API
// reference is the page shell plus the vendored OpenAPI document it renders,
// which changes far more often than the shell.
//
// The same map dates each page in its <head> (src/routeData.ts): published is
// the first commit of its files, modified the last.
import { firstCommitDate, lastCommitDate } from "../../scripts/git-lastmod.mjs";

// The package directory. Not import.meta.url: the route middleware imports this
// file too, and Vite bundles it into dist for that, where import.meta.url no
// longer points here. Every build runs from the package directory.
const root = process.cwd();

/** The files behind one URL path, such as "/guides/import/". */
function sources(pathname) {
  if (pathname === "/api/") return ["src/pages/api.astro", "public/openapi.yaml"];
  const slug = pathname.replace(/^\/|\/$/g, "") || "index";
  const base = `src/content/docs/${slug}`;
  return [`${base}.mdx`, `${base}.md`, `${base}/index.mdx`, `${base}/index.md`];
}

export const lastmodFor = (pathname) => lastCommitDate(root, sources(pathname));

/** A page's published and modified dates (ISO 8601), either undefined when git cannot say. */
export function datesFor(pathname) {
  const files = sources(pathname.endsWith("/") ? pathname : `${pathname}/`);
  return { published: firstCommitDate(root, files), modified: lastCommitDate(root, files) };
}
