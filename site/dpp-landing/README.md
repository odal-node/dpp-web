# site/dpp-landing/

The Astro project for `odal-node.io`. Read [`../../README.md`](../../README.md) for the workspace-level context first; this README is a thin pointer to the site-specific bits.

## Local development

```bash
# From the workspace root (preferred)
pnpm dev:landing

# Or, equivalently, from inside this folder
pnpm dev
```

Dev server runs on `http://localhost:4321`.

## What's in here

```
site/dpp-landing/
├── astro.config.mjs           # Astro + Tailwind 4 (@tailwindcss/vite) + sitemap; copies workspace public/ in
├── public/
│   └── favicon.svg            # simplified brand mark (vector)
├── src/
│   ├── layouts/
│   │   └── Base.astro         # shared layout: meta, og/twitter, favicon, nav, footer
│   ├── components/
│   │   ├── Nav.astro          # mark + wordmark, mobile hamburger, "Join the waitlist" CTA
│   │   ├── Hero.astro         # navy band hero
│   │   ├── DeadlineCards.astro# regulatory clock (reads data/deadlines.json)
│   │   ├── StandardsRow.astro # standards badges (reads data/standards.json)
│   │   ├── StatusBadge.astro  # alpha / project-status pill
│   │   ├── GetStarted.astro   # navy terminal block
│   │   ├── Roadmap.astro      # status columns (reads data/roadmap.json)
│   │   ├── Section.astro      # eyebrow/title/slot; tones: default|muted|tinted
│   │   └── Footer.astro
│   ├── data/                  # ← editable content lives here, not in components
│   │   ├── deadlines.json     # regulatory dates + citations
│   │   ├── roadmap.json       # Shipped / In build / Horizon items
│   │   └── standards.json
│   ├── pages/
│   │   ├── index.astro        # /          long-scroll home
│   │   ├── waitlist.astro     # /waitlist  email-only signup (no form backend)
│   │   ├── privacy.astro      # /privacy   website privacy policy
│   │   └── 404.astro
│   └── styles/
│       └── global.css         # Tailwind 4 layers + @odal/brand-tokens (CSS-first, no tailwind.config)
```

Brand assets (mark SVGs, OG image, apple-touch-icon) are **not** stored here — they live in the workspace-root `../../public/` and are copied into the build by `viteStaticCopy` (see `astro.config.mjs`), so both sites stay in sync from one source.

Pages prefixed with `_` are drafts: Astro does not build them into routes. They are intentionally excluded from launch and will ship in a future pass.

There is **no `tailwind.config.mjs`** — Tailwind 4 is configured CSS-first via the `@theme` block in `@odal/brand-tokens/tokens.css`.

The section structure and copy follow [`../../docs/WEB_CONTENT_STRATEGY.md`](../../docs/WEB_CONTENT_STRATEGY.md) (§4 landing structure, §7 voice); the visual treatment of those sections follows [`../../docs/redesign/DESIGN_SPEC.md`](../../docs/redesign/DESIGN_SPEC.md) §5; the voice baseline is [`../../docs/BRAND.md`](../../docs/BRAND.md).


## Deployment

Deploys to **Cloudflare Pages** via Git integration (production branch `main`), as a separate project from the docs site. Project settings:

| Setting | Value |
|---|---|
| Root directory | `/` *(repo root — required so the pnpm workspace + lockfile resolve)* |
| Build command | `pnpm install --frozen-lockfile && pnpm build:landing` |
| Output directory | `site/dpp-landing/dist` |
| Custom domain | `odal-node.io` (+ `www.odal-node.io`) |

Because brand assets are pulled from the workspace-root `public/` at build time, a meaningful change to this folder, `packages/brand-tokens/`, or the workspace `public/` should trigger a landing deploy.
