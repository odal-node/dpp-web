# @odal/brand-tokens

Shared brand tokens for the two Odal Node web properties (`odal-node.io` and `docs.odal-node.io`).

This package has no runtime and no build step. The sites read two CSS files:

| File | What it holds | Who imports it |
|---|---|---|
| `tokens.css` | The brand values as CSS custom properties (`--odal-primary-500`, `--odal-font-sans` …) | Both sites |
| `theme.css` | The same values as a Tailwind 4 `@theme` block, so they become utility classes (`bg-primary-900`, `text-neutral-600` …) | The landing site only |
| `colors.ts`, `typography.ts`, `spacing.ts` | The same values as TypeScript constants (`import { primary } from "@odal/brand-tokens"`) | Nothing today; kept for tooling and scripts |

They are separate because `@theme` is Tailwind syntax. The docs site does not use Tailwind, and when `tokens.css` carried the `@theme` block too, the docs build warned about an unknown rule twice and shipped the block unread.

The palette is the **navy/ice system derived from the logo**: navy `#080C2C` surfaces, ice `#B7D4F0` accents, action blue `#2563A8` for interactive elements. The `primary-*` token names predate the palette change and were deliberately kept; only values changed.

## Consumption

Both sites are Tailwind-4 CSS-first — there is **no `tailwind.config.mjs`** anywhere in the workspace. The landing site imports both files in `site/dpp-landing/src/styles/global.css`:

```css
@import "tailwindcss";
@import "@odal/brand-tokens/tokens.css";
@import "@odal/brand-tokens/theme.css";
/* every utility class for the palette (bg-primary-900, text-neutral-600, …) now exists */
```

The docs site maps Starlight's variables onto the custom properties in `site/dpp-docs/src/styles/custom.css`:

```css
@import "@odal/brand-tokens/tokens.css";

:root[data-theme="light"] {
  --sl-color-accent: var(--odal-primary-500);
  --sl-color-accent-high: var(--odal-primary-700);
}
```

## Sync rule

`tokens.css`, `theme.css` and the TypeScript constants repeat the same values under three sets of names. If you change a token, change it in all three in the same pull request.
