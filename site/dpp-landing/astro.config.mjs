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
  // i18n: chrome (nav/footer/badges — src/i18n/ui.ts) is translated for all
  // five locales. Page prose (Hero copy, deadline citations, the
  // data-boundary facts) is not yet — `fallback` + `fallbackType: "rewrite"`
  // serves the English page content under a locale's URL when no
  // locale-specific page exists, so /de/, /it/, /fr/, /es/ resolve instead
  // of 404ing while prose translation is still pending native review.
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de", "it", "fr", "es"],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: "rewrite",
    },
    fallback: {
      de: "en",
      it: "en",
      fr: "en",
      es: "en",
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          de: "de-DE",
          it: "it-IT",
          fr: "fr-FR",
          es: "es-ES",
        },
      },
    }),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      viteStaticCopy({ targets: [{ src: '../../public/**/*', dest: '' }] }),
    ],
  },
  // Static output — deployed to Cloudflare Pages.
  output: "static",
});
