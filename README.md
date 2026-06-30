# dpp-web

The two public-facing web properties for Odal Node, organised as a pnpm workspace and deployed as two independent Cloudflare Pages projects.

| Project | Domain | Stack | Deploy target |
|---|---|---|---|
| `site/dpp-landing/` | `odal-node.io` | Astro + Tailwind 4 | Cloudflare Pages (`odal-node-landing`) |
| `site/dpp-docs/` | `docs.odal-node.io` | Astro + Starlight | Cloudflare Pages (`odal-node-docs`) |
| `packages/brand-tokens/` | — | Internal workspace package | Consumed by both sites |

Each Astro project has its own `package.json` and its own Cloudflare Pages project. They share the `@odal/brand-tokens` package — colour palette, typography, spacing — so brand polish stays in sync without effort. They do not share build pipelines: Cloudflare Pages [build watch paths](https://developers.cloudflare.com/pages/configuration/build-watch-paths/) ensure a push that only touches `site/dpp-docs/` does not redeploy the landing page, and vice versa.

## Quick start

```bash
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

Prerequisites: Node.js 20+ and pnpm (managed via [corepack](https://nodejs.org/api/corepack.html) — the exact version is pinned in `package.json` `packageManager`).

## Status, in one paragraph

The original phased build (workspace foundations → landing MVP → docs IA → polish) is complete through its first three phases, and the **June 2026 redesign** (see `docs/redesign/`) re-skinned both sites onto the navy/ice brand, replaced retired messaging with *"Signed by you. Verified by anyone."*, moved editable content into data files, and corrected stale claims. What remains before public launch: the Quick Start compile-verification, Lighthouse/a11y pass, CI workflow, the repository `LICENSE` decision, and deployment (see `docs/ROADMAP.md` status header and `docs/redesign/EXECUTION_NOTES.md` §3–4).


## Repository layout

```
dpp-web/
├── package.json                    # workspace root, scripts proxy to projects
├── pnpm-workspace.yaml             # declares site/* projects and packages/*
├── pnpm-lock.yaml                  # single lockfile for the whole workspace
├── README.md                       # this file
│
├── docs/                           # planning documents (see above)
│   └── redesign/                   # June 2026 redesign record (history; DESIGN_SPEC still current)
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

## Independent deploys, shared brand

The architectural commitment of this repository is *independence at the deployment layer, coherence at the brand layer*. Pushing to `main` with a change that only touches `site/dpp-docs/src/content/docs/quick-start.mdx` produces a single docs deploy and zero landing deploys. Pushing a change that touches `packages/brand-tokens/` produces two deploys, because a token change genuinely should re-render both surfaces. This is enforced via Cloudflare Pages build watch paths rather than at the Git layer.

## What lives elsewhere

This repository contains marketing copy and technical documentation, not source code for the Odal Node product itself.

The [`dpp-core`](https://github.com/odal-node/dpp-core) repository (Apache-2.0) holds the regulatory-standard Rust library — domain types, port traits, cryptography, GS1 Digital Link, schema validation, the compliance calculators, the Wasm plugin ABI. The docs site documents `dpp-core`; it does not contain its source.

The [`dpp-engine`](https://github.com/odal-node/dpp-engine) repository (BSL-1.1, with a production self-host grant) holds the deployment layer — HTTP services, persistence, authentication, telemetry, the public resolver, the Wasm plugin sandbox. The docs site documents `dpp-engine`; it does not contain its source.

The relationship between the repositories — the open-core boundary, the dependency direction, the licensing rationale — is covered on the docs site under [Design Principles](https://docs.odal-node.io/design/open-core) and in the parent project's strategy documents.

## License

**Open decision (pre-launch):** the source of both sites ships under a permissive licence — Apache-2.0 or MIT — to be settled before the repository goes public. Recommendation on file: Apache-2.0, for consistency with `dpp-core` (one licence story, not two). The deployed sites' content is freely readable; the source licence governs reuse of the markup and styling work.
