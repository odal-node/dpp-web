# site/dpp-docs/

The Astro + Starlight project for `docs.odal-node.io`. Read [`../../README.md`](../../README.md) for the workspace-level context first; this README is the site-specific pointer.

## Local development

```bash
# From the workspace root (preferred)
pnpm dev:docs

# Or, equivalently, from inside this folder
pnpm dev
```

Dev server runs on `http://localhost:4325`, so it can run beside the landing site's on 4321; links to the landing site point there.

## What's in here

```
site/dpp-docs/
├── astro.config.mjs                   # Starlight config: redirects, head (JSON-LD, share image), dev server on 4325
├── openapi-source.json                # the dpp-engine commit public/openapi.yaml is vendored from
├── public/
│   ├── _headers                       # Cloudflare Pages headers: HSTS, CSP, caching
│   ├── favicon.svg                    # the brand mark
│   └── openapi.yaml                   # the engine's API spec, vendored (do not edit here)
├── scripts/
│   └── sync-openapi.mjs               # sync:openapi / check:openapi against openapi-source.json
├── src/
│   ├── assets/
│   │   ├── logo-light.svg             # navy mark for the light header
│   │   └── logo-dark.svg              # ice mark for the dark header
│   ├── content/
│   │   └── docs/
│   │       ├── index.mdx              # /              Starlight splash / landing
│   │       ├── introduction.mdx       # /introduction
│   │       ├── quick-start.mdx        # /quick-start
│   │       ├── core-concepts.mdx      # /core-concepts
│   │       ├── getting-started/       # what Odal can and cannot see, licensing
│   │       ├── core/                  # The Core (Apache-2.0) sidebar group
│   │       ├── engine/                # The Engine (BSL-1.1) sidebar group
│   │       ├── guides/                # Using the node sidebar group
│   │       └── regulatory/            # Regulatory Context sidebar group
│   ├── pages/
│   │   ├── api.astro                  # /api: the Scalar API reference, outside the Starlight shell
│   │   └── llms.txt.ts                # /llms.txt, built from the sidebar
│   ├── scripts/mount-api-reference.ts # Scalar's config: no proxy, no AI features, no CDN fonts
│   ├── sidebar.mjs                    # the sidebar, read by astro.config.mjs and /llms.txt
│   ├── middleware.ts, lib/origins.ts  # point landing links at this build's landing site
│   └── styles/
│       ├── custom.css                 # Starlight overrides via @odal/brand-tokens
│       └── scalar-api-reference.css   # Scalar theme: the docs' colours, at AA contrast
```

Brand assets live in this site’s own `public/` and `src/assets/`. There is no shared asset directory — the two sites are deployed independently, and a cross-site copy step was removed because it published a duplicate favicon at a path nothing referenced.

The sidebar is declared in `src/sidebar.mjs` and mirrored by the file-system layout under `src/content/docs/`. Renamed or removed slugs keep a redirect (e.g. `/design/proof-bound` → `/getting-started/what-odal-can-and-cannot-see`); the full redirect map is in `astro.config.mjs`.

## Terminology rules

**Proof-bound architecture** (never "no-touch"); compliance calculators are **open** (never "pro-tier"); deployment claims only for shipped code — capability claims ("wasm32-safe, can run in edge runtimes") are fine. State what is built in the present tense and what is planned in the future tense, and never mix the two in one sentence.

## Deployment

Deploys to **Cloudflare Pages** via Git integration (production branch `main`), as a separate project from the landing site. Project settings:

| Setting | Value |
|---|---|
| Root directory | `/` *(repo root — required so the pnpm workspace + lockfile resolve)* |
| Build command | `pnpm install --frozen-lockfile && pnpm build:docs` |
| Output directory | `site/dpp-docs/dist` |
| Custom domain | `docs.odal-node.io` |

A meaningful change to this folder or to `packages/brand-tokens/` should trigger a docs deploy.
