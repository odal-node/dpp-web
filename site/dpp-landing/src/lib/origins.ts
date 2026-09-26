// origins.ts — where the documentation site lives for this build.
//
// Pages link to the docs by their production address. A preview build of a
// branch other than main (Cloudflare Pages sets CF_PAGES_BRANCH) and the dev
// server must point those links at their own counterpart instead: production
// serves main, so a page that exists only on the branch answered 404 there,
// which is how links from the staging landing to new docs pages broke.
// src/middleware.ts does the rewriting; DOCS_ORIGIN overrides the choice.
export const PRODUCTION_DOCS = "https://docs.odal-node.io";

/** Cloudflare's branch alias: lower case, anything else becomes a hyphen. */
const alias = (branch: string) =>
  branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const branch = process.env.CF_PAGES_BRANCH;

export const DOCS_ORIGIN =
  process.env.DOCS_ORIGIN ??
  (import.meta.env.DEV
    ? "http://localhost:4321"
    : branch && branch !== "main"
      ? `https://${alias(branch)}.odal-node-docs.pages.dev`
      : PRODUCTION_DOCS);
