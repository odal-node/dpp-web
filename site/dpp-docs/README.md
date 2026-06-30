# site/dpp-docs/

The Astro + Starlight project for `docs.odal-node.io`. Read [`../../README.md`](../../README.md) for the workspace-level context first; this README is the site-specific pointer.

## Local development

```bash
# From the workspace root (preferred)
pnpm dev:docs

# Or, equivalently, from inside this folder
pnpm dev
```

Dev server runs on `http://localhost:4321`.

## What's in here

```
site/dpp-docs/
├── astro.config.mjs                   # Starlight config — sidebar, redirects, editLink, favicon
├── public/
│   └── favicon.svg                    # simplified brand mark (vector)
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
│   │       ├── getting-started/       # "What Odal can and cannot see"
│   │       ├── core/                  # The Core (Apache-2.0) sidebar group
│   │       ├── engine/                # The Engine (BSL-1.1) sidebar group
│   │       └── regulatory/            # Regulatory Context sidebar group
│   └── styles/
│       └── custom.css                 # Starlight overrides via @odal/brand-tokens
```

Brand assets shared with the landing site come from the workspace-root `../../public/brand/`, copied into the build by `viteStaticCopy` (see `astro.config.mjs`).

The sidebar structure is declared in `astro.config.mjs` and mirrored by the file-system layout under `src/content/docs/`. Renamed or removed slugs keep a redirect (e.g. `/design/proof-bound` → `/getting-started/what-odal-can-and-cannot-see`); the full redirect map is in `astro.config.mjs`. The current IA decisions live in [`../../docs/WEB_CONTENT_STRATEGY.md`](../../docs/WEB_CONTENT_STRATEGY.md) §6.

## Honest stubs for `dpp-engine`

Pages under `src/content/docs/engine/` that document unshipped surfaces use the `<span class="status-badge ...">` pattern to display development status (Shipped / In build / Horizon). The stubs are honest — they say what the page will document, what status the surface is in, and where to track progress. They are not "coming soon" placeholders.

## Terminology rules

**Proof-bound architecture** (never "no-touch"); compliance calculators are **open** (never "pro-tier"); deployment claims only for shipped code — capability claims ("wasm32-safe, can run in edge runtimes") are fine. Full rules: [`../../docs/WEB_CONTENT_STRATEGY.md`](../../docs/WEB_CONTENT_STRATEGY.md) §7.

## Deployment

Deploys to **Cloudflare Pages** via Git integration (production branch `main`), as a separate project from the landing site. Project settings:

| Setting | Value |
|---|---|
| Root directory | `/` *(repo root — required so the pnpm workspace + lockfile resolve)* |
| Build command | `pnpm install --frozen-lockfile && pnpm build:docs` |
| Output directory | `site/dpp-docs/dist` |
| Custom domain | `docs.odal-node.io` |

A meaningful change to this folder, `packages/brand-tokens/`, or the workspace `public/` should trigger a docs deploy.
