// dpp-landing — Astro + Tailwind 4 + sitemap.
//
// Tailwind 4 is consumed via the @tailwindcss/vite plugin (not the old
// @astrojs/tailwind integration, which is deprecated post-Tailwind 4).
// Tailwind config is CSS-first now — see src/styles/global.css and
// packages/brand-tokens/src/theme.css for the @theme block.

import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://odal-node.io",
  integrations: [
    sitemap(),
  ],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  // Static output — deployed to Cloudflare Pages.
  output: "static",
  // Fixed, so the two dev servers can run side by side and link to each other:
  // the docs site expects this one at 4321 (site/dpp-docs/src/lib/origins.ts),
  // and this one expects the docs at 4325 (src/lib/origins.ts).
  server: { port: 4321 },
});
