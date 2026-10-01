# site/dpp-landing/

The Astro project for `odal-node.io`. Read [`../../README.md`](../../README.md) for the workspace-level context first; this README is a thin pointer to the site-specific bits.

## Local development

```bash
# From the workspace root (preferred)
pnpm dev:landing

# Or, equivalently, from inside this folder
pnpm dev
```

Dev server runs on `http://localhost:4321`, beside the docs site's on 4325; links to the docs point there.

## What's in here

```
site/dpp-landing/
├── astro.config.mjs           # Astro + Tailwind 4 (@tailwindcss/vite) + sitemap; dev server on 4321
├── core-source.json           # the dpp-core commit the vendored records in src/data/ come from
├── public/
│   ├── _headers               # Cloudflare Pages headers: HSTS, CSP, caching, no-transform on HTML (root README)
│   ├── favicon.svg            # the brand mark (also shown in the nav, hero and footer)
│   ├── apple-touch-icon.png   # 180px PNG of the mark, for iOS
│   ├── og-image.png           # site-wide share image
│   └── verify/examples/       # engine-built proof files for /verify
├── scripts/
│   └── sync-from-core.mjs     # sync:core / check:core against core-source.json
├── src/
│   ├── layouts/Base.astro     # shared layout: meta, og/twitter, JSON-LD, nav, footer
│   ├── components/            # Nav, Footer, Hero, Section, Button, cards and badges
│   ├── data/                  # ← editable content lives here, not in components
│   │   ├── instruments/       # EU acts, vendored from dpp-core (do not edit here)
│   │   ├── product-groups/    # product-group manifests, vendored from dpp-core
│   │   └── *.json             # roadmap, timeline, FAQ, glossary, standards, page copy
│   ├── lib/
│   │   ├── site-map.ts        # the one list of pages: nav, footer, /sitemap, /llms.txt
│   │   ├── regulations.ts     # passport dates and states, read from the vendored acts
│   │   ├── share-cards.ts     # what each page's share image says; share-image.ts draws it
│   │   ├── verify/            # the in-browser proof-file verifier behind /verify
│   │   └── origins.ts         # where the docs site is for this build (dev, preview, production)
│   ├── pages/                 # one file per route; regulations/ and product-groups/ are generated
│   ├── middleware.ts          # points docs links at this build's docs site
│   └── styles/global.css      # Tailwind 4 layers + @odal/brand-tokens (CSS-first, no tailwind.config)
└── tests/verify.test.ts       # holds /verify to the engine's own verdicts
```

Brand assets (the mark, `favicon.svg`, and the site-wide share image) live in this site’s own `public/`; the nav, hero and footer show the mark as an image of that one file. Each page's own share image is drawn at build time (`src/pages/og/`). Design tokens — the one thing that genuinely must not drift between the sites — are shared through the `@odal/brand-tokens` package instead.

Pages prefixed with `_` are drafts: Astro does not build them into routes. They are intentionally excluded from launch and will ship in a future pass.

There is **no `tailwind.config.mjs`** — Tailwind 4 is configured CSS-first via the `@theme` block in `@odal/brand-tokens/theme.css`.

Section order, copy and visual treatment are all deliberate rather than incidental: each section component carries its own rule in a header comment, and the tone across both sites is plain, unenthusiastic and claim-checkable. The originating decisions are held in an internal design record dated 2026-06-10.


## Deployment

Deploys to **Cloudflare Pages** via Git integration (production branch `main`), as a separate project from the docs site. Project settings:

| Setting | Value |
|---|---|
| Root directory | `/` *(repo root — required so the pnpm workspace + lockfile resolve)* |
| Build command | `pnpm install --frozen-lockfile && pnpm build:landing` |
| Output directory | `site/dpp-landing/dist` |
| Custom domain | `odal-node.io` (+ `www.odal-node.io`) |

A meaningful change to this folder or to `packages/brand-tokens/` should trigger a landing deploy.
