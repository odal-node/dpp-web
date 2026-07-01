# Odal Node Web

**Public-facing web properties: landing page and documentation**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/odal-node/dpp-web/actions/workflows/ci.yml/badge.svg)](https://github.com/odal-node/dpp-web/actions/workflows/ci.yml)
[![Node 22.13+](https://img.shields.io/badge/Node-22.13%2B-brightgreen.svg)](https://nodejs.org/)
[![Status: Active Development](https://img.shields.io/badge/Status-Active%20Development-green.svg)]()

The two public-facing web properties for Odal Node, organised as a pnpm workspace and deployed as two independent Cloudflare Pages projects.

| Project | Domain | Stack | Deploy target |
|---|---|---|---|
| `site/dpp-landing/` | `odal-node.io` | Astro + Tailwind 4 | Cloudflare Pages (`odal-node-landing`) |
| `site/dpp-docs/` | `docs.odal-node.io` | Astro + Starlight | Cloudflare Pages (`odal-node-docs`) |
| `packages/brand-tokens/` | — | Internal workspace package | Consumed by both sites |

Each Astro project has its own `package.json` and its own Cloudflare Pages project. They share the `@odal/brand-tokens` package — colour palette, typography, spacing — so brand polish stays in sync without effort.

---

## Independent Deploys, Shared Brand

The architectural commitment of this repository is *independence at the deployment layer, coherence at the brand layer*. Pushing to `main` with a change that only touches `site/dpp-docs/src/content/docs/quick-start.mdx` produces a single docs deploy and zero landing deploys. Pushing a change that touches `packages/brand-tokens/` produces two deploys, because a token change genuinely should re-render both surfaces. This is enforced via Cloudflare Pages [build watch paths](https://developers.cloudflare.com/pages/configuration/build-watch-paths/) rather than at the Git layer.

---

## Repository Layout

```
dpp-web/
├── package.json                    # workspace root, scripts proxy to projects
├── pnpm-workspace.yaml             # declares site/* projects and packages/*
├── pnpm-lock.yaml                  # single lockfile for the whole workspace
├── README.md                       # this file
│
├── public/brand/                   # canonical brand assets (marks, favicon, og)
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
pnpm dev:docs         # http://localhost:4321  → site/dpp-docs

# Build for production (same command Cloudflare runs)
pnpm -r build

# Type-check + broken-link check
pnpm -r check
```

Prerequisites: Node.js 22.13+ (LTS 24 recommended — pnpm 11 requires `node:sqlite`, unavailable before 22.13) and pnpm (managed via [corepack](https://nodejs.org/api/corepack.html) — the exact version is pinned in `package.json` `packageManager`).

---

## What Lives Elsewhere

This repository contains marketing copy and technical documentation, not source code for the Odal Node product itself.

The [`dpp-core`](https://github.com/odal-node/dpp-core) repository (Apache-2.0) holds the regulatory-standard Rust library — domain types, port traits, cryptography, GS1 Digital Link, schema validation, the compliance calculators, the Wasm plugin ABI. The docs site documents `dpp-core`; it does not contain its source.

The [`dpp-engine`](https://github.com/odal-node/dpp-engine) repository (BSL-1.1, with a production self-host grant) holds the deployment layer — HTTP services, persistence, authentication, telemetry, the public resolver, the Wasm plugin sandbox. The docs site documents `dpp-engine`; it does not contain its source.

The relationship between the repositories — the open-core boundary, the dependency direction, the licensing rationale — is covered on the docs site under [Design Principles](https://docs.odal-node.io/design/open-core) and in the parent project's strategy documents.

---

## Status

The original phased build (workspace foundations → landing MVP → docs IA → polish) is complete through its first three phases, and the **June 2026 redesign** re-skinned both sites onto the navy/ice brand, replaced retired messaging with *"Signed by you. Verified by anyone."*, moved editable content into data files, and corrected stale claims. What remains before public launch: the Lighthouse/a11y pass and deployment. `LICENSE` is settled (Apache-2.0) and CI (`.github/workflows/ci.yml`, gating `pnpm -r build` + `pnpm -r check` on every push/PR) is in place.

---

## License

[Apache License 2.0](LICENSE) — the source of both sites (markup, styling, docs prose, brand tokens) for consistency with `dpp-core` (one licence story, not two). The deployed sites' content is freely readable; the source licence governs reuse of the markup and styling work.

## Security

Do **not** open public issues for security vulnerabilities (e.g. XSS, exposed secrets, dependency CVEs). Report privately to **security@odal-node.io**.

---

*Odal Node — built by [Odal Node](https://odal-node.io)
