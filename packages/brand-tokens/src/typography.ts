/**
 * Odal Node — typography tokens.
 *
 * System-stack-first. No web fonts. See BRAND.md section 4.2 for rationale.
 */

export const fontFamily = {
  sans: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  mono: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "Liberation Mono",
    "monospace",
  ],
} as const;

/** 1.25 (major third) scale, in rem. Base = 1rem = 16px. */
export const fontSize = {
  xs: "0.875rem",   // 14px
  sm: "1rem",       // 16px
  base: "1.25rem",  // 20px
  lg: "1.5rem",     // 24px
  xl: "1.875rem",   // 30px
  "2xl": "2.25rem", // 36px
  "3xl": "3rem",    // 48px
  "4xl": "3.75rem", // 60px
} as const;

export const lineHeight = {
  tight: "1.25",
  body: "1.6",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const letterSpacing = {
  normal: "0",
  tight: "-0.01em",
} as const;
