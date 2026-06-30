/**
 * Odal Node — spacing and radius tokens.
 *
 * 8-pixel base scale with a 12px outlier (see BRAND.md section 4.3).
 */

export const spacing = {
  0: "0",
  1: "0.25rem",  // 4
  2: "0.5rem",   // 8
  3: "0.75rem",  // 12 (outlier)
  4: "1rem",     // 16
  6: "1.5rem",   // 24
  8: "2rem",     // 32
  12: "3rem",    // 48
  16: "4rem",    // 64
  24: "6rem",    // 96
  32: "8rem",    // 128
} as const;

export const radius = {
  none: "0",
  sm: "2px",
  md: "6px",
  lg: "12px",
} as const;

export const shadow = {
  e1: "0 1px 2px rgba(0,0,0,0.04)",
  e2: "0 8px 24px rgba(0,0,0,0.08)",
} as const;
