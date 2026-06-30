# @odal/brand-tokens

Shared brand tokens for the two Odal Node web properties (`odal-node.io` and `docs.odal-node.io`).

This package has no runtime. It exports TypeScript constants for tooling and design-time reference, and a CSS file (`tokens.css`) that carries the same values as CSS custom properties **plus a Tailwind 4 `@theme` block** — which is how both sites actually consume the palette.

The palette is the **navy/ice system derived from the logo**: navy `#080C2C` surfaces, ice `#B7D4F0` accents, action blue `#2563A8` for interactive elements. The `primary-*` token names predate the palette change and were deliberately kept; only values changed.

## Consumption

Both sites are Tailwind-4 CSS-first — there is **no `tailwind.config.mjs`** anywhere in the workspace. The landing site consumes the tokens in `site/dpp-landing/src/styles/global.css`:

```css
@import "tailwindcss";
@import "@odal/brand-tokens/tokens.css";
/* every utility class for the palette (bg-primary-900, text-neutral-600, …) now exists */
```

The docs site maps Starlight's variables onto the same tokens in `site/dpp-docs/src/styles/custom.css`:

```css
@import "@odal/brand-tokens/tokens.css";

[data-theme="light"] {
  --sl-color-accent: var(--odal-primary-500);
  --sl-color-accent-high: var(--odal-primary-700);
}
```

The TypeScript constants (`import { primary, neutral } from "@odal/brand-tokens"`) remain available for tooling and scripts.

## Sync rule

`src/colors.ts` / `src/typography.ts` / `src/spacing.ts` and the CSS mirror in `src/tokens.css` are hand-maintained together. If you change a token, change it in both files in the same PR.
