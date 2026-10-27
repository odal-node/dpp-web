# dpp-web

The two Odal Node websites, [odal-node.io](https://odal-node.io) and
[docs.odal-node.io](https://docs.odal-node.io), as one pnpm workspace under the Apache
License 2.0. Each site is an Astro project deployed as its own Cloudflare Pages
project, and both share one set of brand tokens.

[![CI](https://github.com/odal-node/dpp-web/actions/workflows/ci.yml/badge.svg)](https://github.com/odal-node/dpp-web/actions/workflows/ci.yml)
[![Advisories](https://img.shields.io/github/actions/workflow/status/odal-node/dpp-web/advisories.yml?branch=main&label=advisories)](https://github.com/odal-node/dpp-web/actions/workflows/advisories.yml)
[![External links](https://img.shields.io/github/actions/workflow/status/odal-node/dpp-web/external-links.yml?branch=main&label=external%20links)](https://github.com/odal-node/dpp-web/actions/workflows/external-links.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fodal-node%2Fdpp-web%2Fmain%2Fpackage.json&query=%24.engines.node&label=Node&logo=nodedotjs)](.node-version)
[![Astro](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fodal-node%2Fdpp-web%2Fmain%2Fsite%2Fdpp-landing%2Fpackage.json&query=%24.dependencies.astro&label=Astro&logo=astro)](site/dpp-landing/package.json)
[![odal-node.io](https://img.shields.io/website?url=https%3A%2F%2Fodal-node.io&label=odal-node.io)](https://odal-node.io)
[![docs.odal-node.io](https://img.shields.io/website?url=https%3A%2F%2Fdocs.odal-node.io&label=docs.odal-node.io)](https://docs.odal-node.io)

> [!NOTE]
> **Status: pre-production.** The sites describe software that no operator runs
> against real product data yet. Every change lands on `staging` and is reviewed on
> its previews before it is promoted to `main`, which is what the sites serve.

## Quick start

Node (the version in `.node-version`; `package.json` states the minimum) and pnpm,
which corepack installs at the version `package.json` pins.

```bash
corepack enable
pnpm install
pnpm dev:landing   # http://localhost:4321
pnpm dev:docs      # http://localhost:4325; run both and they link to each other
```

To check what you changed the way CI will, build first: several checks read the build.

```bash
pnpm -r build
pnpm -r check
pnpm run check:links
```

## How it fits together

| Folder | Site | Stack | Pages project |
|---|---|---|---|
| `site/dpp-landing/` | `odal-node.io`, `www.odal-node.io` | Astro + Tailwind 4 | `odal-node-landing` |
| `site/dpp-docs/` | `docs.odal-node.io` | Astro + Starlight, Scalar on `/api` | `odal-node-docs` |
| `packages/brand-tokens/` | | Colours, type, spacing for both sites | |

Each site has its own README for its layout and Pages build settings.

Some pages are generated from data copied out of the other repositories at a pinned
commit, so a page cannot describe the software differently from its source:

| What | Pin | Refresh |
|---|---|---|
| Product groups and EU acts from `dpp-core`, with a copy of the acts in `site/dpp-docs/src/data/instruments` for the docs | `site/dpp-landing/core-source.json` | `pnpm --filter dpp-landing run sync:core` |
| API spec from `dpp-engine` | `site/dpp-docs/openapi-source.json` | `pnpm run sync:openapi`, or the nightly workflow |

Never edit the vendored files by hand; bump the pin and sync.

Never type a passport date into a page either. The docs write
`<PassportDate act="<id>" />`, landing pages call `passportDateOf("<id>")`, and copy in
`site/dpp-landing/src/data` writes `{passport:<id>}`. All three read the vendored acts
and fail the build when an act records no date. Other regulatory dates are written
beside the article that sets them.

## Checks

CI (`.github/workflows/ci.yml`) runs all of these on every pull request and every
push to `staging` or `main`. `check:links`, `check:spacing`, `check:llms` and
`check:sitemaps` read the build, so build first.

```bash
pnpm -r build
pnpm -r check                                # types and content collections, not links
pnpm run check:links                         # internal links and anchors in both builds
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

## Releasing

`main` is what Cloudflare publishes. Its ruleset matches `dpp-core` and `dpp-engine`:
pull request required, squash only, `build` must pass on an up-to-date branch, no
force-push, no deletion, no bypass.

1. Land work on `staging`, through a pull request or a direct push once the checks pass.
2. Review the previews: `staging.odal-node-landing.pages.dev` and `staging.odal-node-docs.pages.dev`.
3. New or reworked pages get a hand screen-reader and keyboard pass, which `/accessibility` promises.
4. Open a pull request from `staging` to `main` and squash-merge it.
5. Reset `staging` to `main`, so the next pull request lists only new commits (a squash leaves the old ones on `staging` otherwise):
   `git fetch origin && git push --force-with-lease=staging origin origin/main:staging`
6. If pages were added or moved, resubmit both sitemaps in Search Console.

A squash merge sets the sitemap `lastmod` of every page it touches to the merge date.
Dates come from git history (`scripts/git-lastmod.mjs`).

## Automation

| Workflow | When | What |
|---|---|---|
| `ci.yml` | Pull requests, pushes to `staging` and `main` | The checks above |
| `advisories.yml` | Daily, 06:20 UTC | `pnpm audit --audit-level high` against the committed lockfile, so a new advisory surfaces on a day nothing was committed |
| `sync-openapi.yml` | Nightly, 03:17 UTC | Opens a pull request into `staging` when the engine's spec changes |
| `external-links.yml` | Mondays, 04:41 UTC | `check:external` |
| Dependabot | Mondays | Version updates against `staging`, grouped: the Astro packages together, other npm minor and patch updates together, and all GitHub Actions together. TypeScript 7.0 is held back because `astro check` refuses it. Security updates always target `main`; retarget those to `staging` |

Scheduled workflows run from `main` only. Every workflow that sets up Node reads its
version from `.node-version`.

## Cloudflare

- **Pages:** each project builds from the repository root (see the site READMEs). Production is `main`. Every branch gets a preview at `<branch>.<project>.pages.dev`, which Cloudflare marks `noindex`.
- **Headers:** each site's `public/_headers` sets HSTS, a same-origin CSP and caching.
- **`no-transform` on HTML:** the free plan injects a bot-detection script into every HTML page, and it cannot be switched off. The script sets a `cf_clearance` cookie, which the privacy page says the sites do not set. `Cache-Control: no-transform` on HTML stops that injection and Cloudflare's email obfuscation, at the cost of Cloudflare no longer compressing HTML. Other files stay compressed.
- **Editing cache rules:** Pages joins two values of one header with a comma. A rule that sets its own `Cache-Control` must first detach the inherited one with `! Cache-Control`, and no two cache rules may match the same file.
- **Zone:** the `/verify` rate-limit rule (20 requests per 10 s per IP) is kept as code in `scripts/cloudflare-rate-limit.mjs` (`pnpm run rate-limit:verify`, add `-- --apply` to write; the token needs "Zone WAF: Edit"). It does not cover `pages.dev` previews.
- **Cache purge:** run `.github/workflows/deploy.yml` by hand.

## Search and agents

Both sites publish `sitemap-index.xml`, `robots.txt` (content signals:
`search=yes, ai-input=yes, ai-train=no`) and `llms.txt`. On the landing,
`src/lib/site-map.ts` is the one list of pages behind the nav, footer, `/sitemap` and
`llms.txt`; on the docs, `src/sidebar.mjs` is. Submit both sitemaps in Search Console.

No page loads anything from another origin (the CSP allows only the site itself), and
there is no analytics. The API reference sends "Test request" straight to the reader's
node (`proxyUrl: ''` in `site/dpp-docs/src/scripts/mount-api-reference.ts`); check
that this still holds after upgrading `@scalar/api-reference`.

## Elsewhere

The product's source is in [`dpp-core`](https://github.com/odal-node/dpp-core)
(Apache-2.0) and [`dpp-engine`](https://github.com/odal-node/dpp-engine) (BSL-1.1).
This repository holds only the websites.

## Licence

[Apache License 2.0](LICENSE) for the sites' source. It grants no use of the Odal Node
name or logo.

## Security

Report vulnerabilities privately to **security@odal-node.io**, never in a public
issue. See the organization's
[SECURITY.md](https://github.com/odal-node/.github/blob/main/SECURITY.md).
