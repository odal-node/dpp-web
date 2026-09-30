# Odal Node Web

**Public-facing web properties: landing page and documentation**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/odal-node/dpp-web/actions/workflows/ci.yml/badge.svg)](https://github.com/odal-node/dpp-web/actions/workflows/ci.yml)
[![Node 22.13+](https://img.shields.io/badge/Node-22.13%2B-brightgreen.svg)](https://nodejs.org/)
[![Status: Active Development](https://img.shields.io/badge/Status-Active%20Development-green.svg)](https://odal-node.io/roadmap)

The two public-facing web properties for Odal Node, organised as a pnpm workspace and deployed as two independent Cloudflare Pages projects.

| Project | Domain | Stack | Deploy target |
|---|---|---|---|
| `site/dpp-landing/` | `odal-node.io` | Astro + Tailwind 4 | Cloudflare Pages (`odal-node-landing`) |
| `site/dpp-docs/` | `docs.odal-node.io` | Astro + Starlight | Cloudflare Pages (`odal-node-docs`) |
| `packages/brand-tokens/` | — | Internal workspace package | Consumed by both sites |

Each Astro project has its own `package.json` and its own Cloudflare Pages project. They share the `@odal/brand-tokens` package — colour palette, typography, spacing — so brand polish stays in sync without effort.

---

## Independent Deploys, Shared Brand

The architectural commitment of this repository is *independence at the deployment layer, coherence at the brand layer*. A promotion into `main` that only touches `site/dpp-docs/src/content/docs/quick-start.mdx` produces a single docs deploy and zero landing deploys. One that touches `packages/brand-tokens/` produces two deploys, because a token change genuinely should re-render both surfaces. This is enforced via Cloudflare Pages [build watch paths](https://developers.cloudflare.com/pages/configuration/build-watch-paths/) rather than at the Git layer.

---

## Repository Layout

```
dpp-web/
├── package.json                    # workspace root, scripts proxy to projects
├── pnpm-workspace.yaml             # declares site/* projects and packages/*
├── pnpm-lock.yaml                  # single lockfile for the whole workspace
├── README.md                       # this file
│
├── scripts/                        # CI gates: link crawler, leakage scan
│
├── packages/
│   └── brand-tokens/               # @odal/brand-tokens — colour, type, spacing
│
├── site/dpp-landing/               # odal-node.io (Tailwind 4, CSS-first — no tailwind.config)
│   ├── astro.config.mjs
│   └── src/{layouts,components,pages,data,styles}
│
└── site/dpp-docs/                  # docs.odal-node.io (Starlight)
    ├── astro.config.mjs
    └── src/{assets,content/docs,styles}
```

---

## Quick Start

```bash
git clone https://github.com/odal-node/dpp-web.git
cd dpp-web

# Install everything for the whole workspace
pnpm install

# Run a dev server for either site
pnpm dev:landing      # http://localhost:4321  → site/dpp-landing
pnpm dev:docs         # http://localhost:4325  → site/dpp-docs
# Run both at once and links between them point at each other.

# Build for production (same command Cloudflare runs)
pnpm -r build

# Type-check templates and content-collection references
pnpm -r check

# The gates CI runs. Links and spacing read the build, so build first.
pnpm run check:links      # crawl both dist trees for internal links that 404
pnpm run check:spacing    # words glued together across a line break in Astro markup
pnpm run check:leakage    # internal vocabulary / private-repo paths, incl. public/
pnpm run check:openapi    # vendored API spec still matches its pinned engine commit
pnpm --filter dpp-landing run check:core   # vendored core records match their pin
pnpm --filter dpp-landing run test:verify  # the browser verifier agrees with the node's
pnpm run test:scripts     # the rate-limit and external-link scripts
pnpm audit --audit-level high

# Not a pull-request gate: run weekly by .github/workflows/external-links.yml.
pnpm run check:external   # links to other sites (EUR-Lex, GitHub …); fails only on a 404 or 410
```

`pnpm -r check` does **not** check links, and never did — a markdown link target is an opaque
string to `astro check`. That is why `check:links` exists separately and reads the built output
rather than the source: four `[Licensing](/engine/licensing)` links once passed `check` and
404'd in production.

Prerequisites: Node.js 22.13+ (LTS 24 recommended — pnpm 11 requires `node:sqlite`, unavailable before 22.13) and pnpm (managed via [corepack](https://nodejs.org/api/corepack.html) — the exact version is pinned in `package.json` `packageManager`).

---

## What Lives Elsewhere

This repository contains marketing copy and technical documentation, not source code for the Odal Node product itself.

The [`dpp-core`](https://github.com/odal-node/dpp-core) repository (Apache-2.0) holds the regulatory-standard Rust library — domain types, port traits, cryptography, GS1 Digital Link, schema validation, the compliance calculators, the Wasm plugin ABI. The docs site documents `dpp-core`; it does not contain its source.

The [`dpp-engine`](https://github.com/odal-node/dpp-engine) repository (BSL-1.1, with a production self-host grant) holds the deployment layer — HTTP services, persistence, authentication, telemetry, the public resolver, the Wasm plugin sandbox. The docs site documents `dpp-engine`; it does not contain its source.

The relationship between the repositories — the open-core boundary, the dependency direction, the licensing rationale — is covered on the docs site under [Core Concepts](https://docs.odal-node.io/core-concepts) and [Licensing](https://docs.odal-node.io/getting-started/licensing), and in the parent project's strategy documents.

---

## Status

The original phased build (workspace foundations → landing MVP → docs IA → polish) is complete through its first three phases, and the **June 2026 redesign** re-skinned both sites onto the navy/ice brand, replaced retired messaging with *"Signed by you. Verified by anyone."*, and moved editable content into data files. `LICENSE` is settled (Apache-2.0).

An **August 2026 audit** of both sites read every published page against primary regulatory text and against the engine's source. It found a delegated act that does not exist described as adopted, roughly twenty misattributed citations, four security-property claims the code contradicted, and a registry described as unbuilt eight months after it went live. Those are corrected; the findings register lives outside this repository.

The hand pass the landing's accessibility page describes (a person, with a screen reader and a keyboard alone) was done by the founder before promotion. Pages added or reworked later need the same pass before they are published. What remains before public launch: a named data controller in the privacy policy — which is blocked on a registered entity existing, not on a copy edit.

The keyboard pass is done. On 2026-09-27 every page of both sites was walked with Tab alone at 1280px and 375px in headless Chromium: every control shows a focus ring, nothing traps focus, the first Tab on the landing reaches "Skip to content", and the menus, the passport check and /verify work from the keyboard. axe-core 4.13 (WCAG 2.0–2.2 A and AA, plus best practice) ran on every page of both sites at both widths and, on the docs, in both themes. The landing is clean. What it still reports is inside Scalar's API reference on `/api` (ARIA attributes on the wrong roles, a few icon buttons with no name, a second banner landmark on a phone, a scrolling list that cannot take focus) and Expressive Code's unnamed code-block regions on the docs, a best-practice rule rather than a WCAG one. Those are third-party markup this repository does not render.

The API reference does not relay requests through a third party. Checked at runtime on 2026-09-27: in headless Chromium, "Test Request → Send" on `/api` went straight to the spec's server (`http://localhost:8001/vault/api/v1/dpp`), and the session made no request to any `scalar.com` host. That rests on `proxyUrl: ''` in `site/dpp-docs/src/scripts/mount-api-reference.ts`; re-check it after upgrading `@scalar/api-reference`.

## Rate limit on /verify

/verify checks files in the browser, so there is no server of ours to limit. The limit is a
Cloudflare rate-limiting rule on the `odal-node.io` zone: paths starting with `/verify`, 20
requests per 10 seconds per IP address, then 429 for 10 seconds. That is the most the Free plan
allows, and well above one person's use (a visit is the page plus at most five example files).
It covers the custom domain only; `*.pages.dev` previews are not in the zone.

The zone is not managed as code elsewhere, so `scripts/cloudflare-rate-limit.mjs` is the rule's
source of truth. It replaces only its own rule and keeps any other:

```bash
# Dry run: prints the ruleset it would write. The token needs "Zone WAF: Edit".
CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ZONE_ID=… pnpm run rate-limit:verify

# Write it
CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ZONE_ID=… pnpm run rate-limit:verify -- --apply
```

## How changes land

`main` is what Cloudflare Pages publishes, so nothing lands on it directly.

- **`staging`** is the integration branch. Work branches off it and merges back through a pull request.
- Promotion is a second pull request, `staging` → `main`, reviewed on its own.
- `main` carries a ruleset matching the other repositories: pull request required, squash-only, CI must pass, no force-push, no deletion, and **no bypass for anyone** — including the owner.

CI (`.github/workflows/ci.yml`) runs build, type-check, and the gates listed above on every pull request and every push to `main`, with the workflow token scoped to `contents: read` and every action pinned to a commit. A push to `staging` alone runs no CI, so run the gates locally before pushing there.

---

## License

[Apache License 2.0](LICENSE) — the source of both sites (markup, styling, docs prose, brand tokens) for consistency with `dpp-core` (one licence story, not two). The deployed sites' content is freely readable; the source licence governs reuse of the markup and styling work.

## Security

Do **not** open public issues for security vulnerabilities (e.g. XSS, exposed secrets, dependency CVEs). Report privately to **security@odal-node.io**.

---

*Odal Node — built by [Odal Node](https://odal-node.io)*
