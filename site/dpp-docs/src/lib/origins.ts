// origins.ts — where the landing site lives for this build.
//
// Pages link to the landing site by its production address. A preview build of
// a branch other than main (Cloudflare Pages sets CF_PAGES_BRANCH) and the dev
// server must point those links at their own counterpart instead: production
// serves main, so a page that exists only on the branch answered 404 there.
// src/middleware.ts does the rewriting; LANDING_ORIGIN overrides the choice.
export const PRODUCTION_LANDING = 'https://odal-node.io';

/** Cloudflare's branch alias: lower case, anything else becomes a hyphen. */
const alias = (branch: string) =>
  branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const branch = process.env.CF_PAGES_BRANCH;

export const LANDING_ORIGIN =
  process.env.LANDING_ORIGIN ??
  (import.meta.env.DEV
    ? 'http://localhost:4325'
    : branch && branch !== 'main'
      ? `https://${alias(branch)}.odal-node-landing.pages.dev`
      : PRODUCTION_LANDING);
