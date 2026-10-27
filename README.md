# Odal Node Web

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/odal-node/dpp-web/actions/workflows/ci.yml/badge.svg)](https://github.com/odal-node/dpp-web/actions/workflows/ci.yml)
[![Node 22.13+](https://img.shields.io/badge/Node-22.13%2B-brightgreen.svg)](https://nodejs.org/)

The two Odal Node websites, as one pnpm workspace deployed as two Cloudflare Pages projects.

| Folder | Site | Stack | Pages project |
|---|---|---|---|
| `site/dpp-landing/` | `odal-node.io`, `www.odal-node.io` | Astro + Tailwind 4 | `odal-node-landing` |
| `site/dpp-docs/` | `docs.odal-node.io` | Astro + Starlight, Scalar on `/api` | `odal-node-docs` |
| `packages/brand-tokens/` | | Colours, type, spacing for both sites | |

Each site has its own README for its layout and Pages build settings.

## Develop

Node 22.13+ and pnpm (version pinned in `package.json`, via corepack).

```bash
pnpm install
pnpm dev:landing   # http://localhost:4321
pnpm dev:docs      # http://localhost:4325; run both and they link to each other
```

## Checks

CI (`.github/workflows/ci.yml`) runs all of these on every pull request and every push to `main`. Pushes to `staging` run no CI, so run them locally first. `check:links`, `check:spacing`, `check:llms` and `check:sitemaps` read the build, so build first.

```bash
pnpm -r build
pnpm -r check                                # types and content collections, not links
pnpm run check:links                         # internal links in both builds
pnpm run check:spacing                       # words glued across a line break
pnpm run check:leakage                       # internal names and private paths
pnpm run check:llms                          # llms.txt matches the pages
pnpm run check:sitemaps                      # sitemaps and their lastmod dates
pnpm run test:scripts
pnpm --filter dpp-landing run check:core     # vendored core data matches its pin (DPP_CORE_DIR)
pnpm --filter dpp-landing run test:verify    # /verify agrees with the engine's verifier
pnpm run check:openapi                       # vendored API spec matches its pin (DPP_ENGINE_DIR)
pnpm audit --audit-level high
pnpm run check:external                      # outside links; weekly in CI, not a PR gate
```

## Vendored inputs

| What | Pin | Refresh |
|---|---|---|
| Product groups and EU acts from `dpp-core` | `site/dpp-landing/core-source.json` | `pnpm --filter dpp-landing run sync:core` |
| API spec from `dpp-engine` | `site/dpp-docs/openapi-source.json` | `pnpm run sync:openapi`, or the nightly workflow |

Never edit the vendored files by hand; bump the pin and sync.

## Releasing

`main` is what Cloudflare publishes. Its ruleset matches `dpp-core` and `dpp-engine`: pull request required, squash only, `build` must pass on an up-to-date branch, no force-push, no deletion, no bypass.

1. Land work on `staging`, through a pull request or a direct push once the checks pass.
2. Review the previews: `staging.odal-node-landing.pages.dev` and `staging.odal-node-docs.pages.dev`.
3. New or reworked pages get a hand screen-reader and keyboard pass, which `/accessibility` promises.
4. Open a pull request from `staging` to `main` and squash-merge it.
5. Reset `staging` to `main`, so the next pull request lists only new commits (a squash leaves the old ones on `staging` otherwise):
   `git fetch origin && git push --force-with-lease=staging origin origin/main:staging`
6. If pages were added or moved, resubmit both sitemaps in Search Console.

A squash merge sets the sitemap `lastmod` of every page it touches to the merge date. Dates come from git history (`scripts/git-lastmod.mjs`).

## Cloudflare

- **Pages:** each project builds from the repository root (see the site READMEs). Production is `main`. Every branch gets a preview at `<branch>.<project>.pages.dev`, which Cloudflare marks `noindex`.
- **Headers:** each site's `public/_headers` sets HSTS, a same-origin CSP and caching.
- **`no-transform` on HTML:** the free plan injects a bot-detection script into every HTML page, and it cannot be switched off. The script sets a `cf_clearance` cookie, which the privacy page says the sites do not set. `Cache-Control: no-transform` on HTML stops that injection and Cloudflare's email obfuscation, at the cost of Cloudflare no longer compressing HTML. Other files stay compressed.
- **Editing cache rules:** Pages joins two values of one header with a comma. A rule that sets its own `Cache-Control` must first detach the inherited one with `! Cache-Control`, and no two cache rules may match the same file.
- **Zone:** the `/verify` rate-limit rule (20 requests per 10 s per IP) is kept as code in `scripts/cloudflare-rate-limit.mjs` (`pnpm run rate-limit:verify`, add `-- --apply` to write; the token needs "Zone WAF: Edit"). It does not cover `pages.dev` previews.
- **Cache purge:** run `.github/workflows/deploy.yml` by hand.

## Automation

| Workflow | When | What |
|---|---|---|
| `ci.yml` | Pull requests, pushes to `main` | The checks above |
| `sync-openapi.yml` | Nightly, 03:17 UTC | Opens a pull request into `staging` when the engine's spec changes |
| `external-links.yml` | Mondays, 04:41 UTC | `check:external` |
| Dependabot | Weekly | npm and Actions updates. Its pull requests target `main`; retarget them to `staging` |

Scheduled workflows run from `main` only.

## Search and agents

Both sites publish `sitemap-index.xml`, `robots.txt` (content signals: `search=yes, ai-input=yes, ai-train=no`) and `llms.txt`. On the landing, `src/lib/site-map.ts` is the one list of pages behind the nav, footer, `/sitemap` and `llms.txt`; on the docs, `src/sidebar.mjs` is. Submit both sitemaps in Search Console.

No page loads anything from another origin (the CSP allows only the site itself), and there is no analytics. The API reference sends "Test request" straight to the reader's node (`proxyUrl: ''` in `site/dpp-docs/src/scripts/mount-api-reference.ts`); check that this still holds after upgrading `@scalar/api-reference`.

## Elsewhere

The product's source is in [`dpp-core`](https://github.com/odal-node/dpp-core) (Apache-2.0) and [`dpp-engine`](https://github.com/odal-node/dpp-engine) (BSL-1.1). This repository holds only the websites.

## License and security

[Apache-2.0](LICENSE) for the sites' source. It grants no use of the Odal Node name or logo.

Report vulnerabilities privately to **security@odal-node.io**, never in a public issue.
