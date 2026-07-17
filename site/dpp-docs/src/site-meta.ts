// Shared between content.config.ts (Starlight page banner default) and
// pages/api.astro (hand-built banner, since that page skips the Starlight
// layout entirely) so the two can't drift apart.
export const ALPHA_BANNER_TEXT =
  'Alpha — Odal Node is in active development. APIs, schemas, and docs may and will change before 1.0.';
