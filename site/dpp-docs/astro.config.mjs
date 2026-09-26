import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { sidebar } from './src/sidebar.mjs';

export default defineConfig({
  site: 'https://docs.odal-node.io',
  // Renamed pages keep their old URLs working.
  redirects: {
    // Design pages removed; redirect to the closest living equivalent.
    '/design/no-touch-data': '/getting-started/what-odal-can-and-cannot-see',
    '/design/proof-bound': '/getting-started/what-odal-can-and-cannot-see',
    '/design/open-core': '/getting-started/licensing',
    // Licensing covers core and node alike, so it sits with the orientation pages.
    '/engine/licensing': '/getting-started/licensing',
    '/design/adr': '/core-concepts',
    '/design/why-no-capability-gating': '/core-concepts',
    // Core consolidated from per-crate/type pages into three concept pages.
    '/core/domain-types': '/core/overview',
    '/core/cryptography': '/core/overview',
    '/core/gs1': '/core/standards',
    '/core/aas-mapping': '/core/standards',
    '/core/port-traits': '/core/sectors',
    '/core/compliance-registry': '/core/sectors',
    '/core/sector-plugins': '/core/sectors',
    // Engine: endpoint-level API reference belongs in the code/OpenAPI, not here.
    '/engine/api': '/engine/architecture',
    '/engine/identity': '/engine/architecture',
    // The vault/integrator/resolver surfaces are described inline on the
    // architecture page; the engine section now leads with what a node
    // guarantees (retention) and how it protects itself (security).
    '/engine/vault': '/engine/architecture',
    '/engine/resolver': '/engine/architecture',
    '/engine/integrator': '/engine/architecture',
  },
  vite: {
    // The API reference imports Scalar only on /api. Left to discovery, the dev
    // server found Scalar's dependencies on the first visit, re-bundled them
    // mid-load and answered the page's own requests with "504 Outdated
    // Optimize Dep", so /api rendered blank until a restart. Bundling it at
    // startup removes the late discovery. Production builds are unaffected.
    optimizeDeps: { include: ['@scalar/api-reference'] },
  },
  integrations: [
    starlight({
      title: 'Odal Node',
      description: 'EU Digital Product Passport infrastructure — open-source core, sovereign by design, built for ESPR compliance.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/odal-node/dpp-core' },
      ],
      favicon: '/favicon.svg',
      head: [
        // Structured data. This site had none, which is the odd gap: it is the
        // content-rich property, and the one a search engine or an assistant
        // has most reason to quote. `SoftwareSourceCode` is the accurate type —
        // this documents a library and an engine, not a SaaS product, so
        // `SoftwareApplication` (which implies an installable end-user app with
        // an operating system and a price) would overstate what is here.
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'SoftwareSourceCode',
                '@id': 'https://docs.odal-node.io/#software',
                name: 'Odal Node',
                alternateName: 'Odal Node DPP infrastructure',
                description:
                  'Open-source EU Digital Product Passport (DPP) infrastructure. Self-hosted software for issuing, signing, holding and serving the product logbooks required by the Ecodesign for Sustainable Products Regulation and the Battery Regulation.',
                codeRepository: 'https://github.com/odal-node/dpp-core',
                programmingLanguage: 'Rust',
                license: 'https://www.apache.org/licenses/LICENSE-2.0',
                url: 'https://odal-node.io/',
                keywords: [
                  'digital product passport',
                  'DPP',
                  'product logbook',
                  'ESPR',
                  'battery passport',
                  'open source',
                  'self-hosted',
                  'EU compliance',
                  'EN 18219',
                  'GS1 Digital Link',
                ],
              },
              {
                '@type': 'TechArticle',
                '@id': 'https://docs.odal-node.io/#docs',
                name: 'Odal Node documentation',
                about: { '@id': 'https://docs.odal-node.io/#software' },
                inLanguage: 'en',
                isAccessibleForFree: true,
                // Named so a reader — human or machine — can tell what the
                // regulatory pages are grounded in.
                citation: [
                  'Regulation (EU) 2024/1781 (ESPR)',
                  'Regulation (EU) 2023/1542 (Batteries)',
                  'Commission Implementing Regulation (EU) 2026/1778 (DPP registry)',
                ],
              },
            ],
          }),
        },
        // 🚨 These pointed at `favicon.svg`, declared 400x400, and the result
        // was that every share of a docs URL rendered with no image at all.
        // Two independent reasons: Slack, LinkedIn and X do not reliably
        // render an SVG `og:image`, and 400x400 is not the aspect ratio an
        // unfurler expects. `og-image.png` is the landing site's card, reused
        // — one brand, one preview — at the conventional 1200x630.
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://docs.odal-node.io/og-image.png' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://docs.odal-node.io/og-image.png' } },
        // Without this, X renders the small square card whatever the image is.
        // The landing layout already sets it; this site set no card type at all.
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      sidebar,
      customCss: ['./src/styles/custom.css'],
    }),
  ],
  output: 'static',
});
