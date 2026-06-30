// dpp-landing — Astro 5 + Tailwind 4 + sitemap.
//
// Tailwind 4 is consumed via the @tailwindcss/vite plugin (not the old
// @astrojs/tailwind integration, which is deprecated post-Tailwind 4).
// Tailwind config is CSS-first now — see src/styles/global.css and
// packages/brand-tokens/src/tokens.css for the @theme block.

import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  site: "https://odal-node.io",
  integrations: [sitemap()],
  vite: {
    plugins: [
      tailwindcss(),
      viteStaticCopy({ targets: [{ src: '../../public/**/*', dest: '' }] }),
    ],
  },
  // Static output — deployed to Cloudflare Pages.
  output: "static",
});
