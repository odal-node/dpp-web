// dpp-landing — Astro 5 + Tailwind 4 + sitemap.
//
// Tailwind 4 is consumed via the @tailwindcss/vite plugin (not the old
// @astrojs/tailwind integration, which is deprecated post-Tailwind 4).
// Tailwind config is CSS-first now — see src/styles/global.css and
// packages/brand-tokens/src/tokens.css for the @theme block.

import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://odal-node.io",
  integrations: [
    sitemap({
      // A page carrying `noindex` must not also be advertised in the
      // sitemap: the two instructions contradict each other, and a
      // crawler that follows the sitemap first has been told to index
      // something the page then refuses. /main is a draft published
      // beside the live home page for comparison, not a second entry
      // point competing for the same queries.
      filter: (page) => !/\/main\/?$/.test(page),
    }),
  ],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  // Static output — deployed to Cloudflare Pages.
  output: "static",
});
