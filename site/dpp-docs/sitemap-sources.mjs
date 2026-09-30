// sitemap-sources.mjs — which files each page's content comes from, so the
// sitemap's <lastmod> moves when that content changes (scripts/git-lastmod.mjs).
//
// A docs page is its own content file under src/content/docs. The API
// reference is the page shell plus the vendored OpenAPI document it renders,
// which changes far more often than the shell.
import { fileURLToPath } from "node:url";
import { lastCommitDate } from "../../scripts/git-lastmod.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));

/** The files behind one URL path, such as "/guides/import/". */
function sources(pathname) {
  if (pathname === "/api/") return ["src/pages/api.astro", "public/openapi.yaml"];
  const slug = pathname.replace(/^\/|\/$/g, "") || "index";
  const base = `src/content/docs/${slug}`;
  return [`${base}.mdx`, `${base}.md`, `${base}/index.mdx`, `${base}/index.md`];
}

export const lastmodFor = (pathname) => lastCommitDate(root, sources(pathname));
