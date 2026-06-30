/**
 * Odal Node — colour tokens.
 *
 * These constants are the single source of truth for brand colour across both
 * Astro projects. Both `site/dpp-landing/tailwind.config.mjs` and the docs site's
 * Starlight CSS-variable overrides import from here (directly, or via the
 * mirrored CSS custom properties in `tokens.css`).
 *
 * See BRAND.md section 4.1 for the editorial rationale behind each scale.
 */

/**
 * Primary scale — navy/ice blue family, anchored on the logo
 * (decision 2026-06-10, docs/redesign/DESIGN_SPEC.md §1).
 * 50–300 are ice tints (the logo stroke is 300); 500/600 are the interactive
 * action blues (AA on white); 800/900 are the navy surfaces (logo field = 900).
 */
export const primary = {
  50: "#eff5fb",
  100: "#e3eef9",
  200: "#c9def3",
  300: "#b7d4f0", // logo ice-blue stroke
  400: "#5e8fc7",
  500: "#2563a8", // action blue — links/buttons on white
  600: "#1d4f87",
  700: "#163d6b",
  800: "#11173f",
  900: "#080c2c", // logo navy field
} as const;

/** Warm neutrals — for body text, borders, surfaces. */
export const neutral = {
  0: "#ffffff",
  50: "#fafaf9",
  100: "#f5f5f4",
  200: "#e7e5e4",
  300: "#d6d3d1",
  400: "#a8a29e",
  500: "#78716c",
  600: "#57534e",
  700: "#44403c",
  800: "#292524",
  900: "#1c1917",
  1000: "#0a0a09",
} as const;

/**
 * Regulatory semantic colour — used sparingly to mark an EU-regulation
 * reference or a regulatory deadline. NOT a brand colour; a semantic one.
 */
export const regulatory = {
  bg: "#fff7ed",
  border: "#fdba74",
  text: "#9a3412",
} as const;

/** Roadmap / development-status badge palette. Semantic, not brand: shipped stays green. */
export const status = {
  released: "#2e7d32", // green  — semantic "shipped", decoupled from the brand scale
  active: "#d97706",   // amber
  development: neutral[500],
} as const;

/** Public re-export for convenience. */
export const colors = {
  primary,
  neutral,
  regulatory,
  status,
} as const;

export type ColorScale = typeof primary;
export type Palette = typeof colors;
