// middleware.ts — points links to the docs at this build's docs site.
//
// Runs for every page, in the dev server and when a page is prerendered, so it
// reaches links written in components, pages and JSON copy alike. A production
// build changes nothing. See lib/origins.ts for why.
import { defineMiddleware } from "astro:middleware";
import { DOCS_ORIGIN, PRODUCTION_DOCS } from "./lib/origins";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (DOCS_ORIGIN === PRODUCTION_DOCS) return response;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
  const html = await response.text();
  return new Response(html.replaceAll(`href="${PRODUCTION_DOCS}`, `href="${DOCS_ORIGIN}`), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});
