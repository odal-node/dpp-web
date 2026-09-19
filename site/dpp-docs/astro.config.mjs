import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  site: 'https://docs.odal-node.io',
  // Renamed pages keep their old URLs working (WEB_CONTENT_STRATEGY.md §6).
  redirects: {
    // Design pages removed; redirect to the closest living equivalent.
    '/design/no-touch-data': '/getting-started/what-odal-can-and-cannot-see',
    '/design/proof-bound': '/getting-started/what-odal-can-and-cannot-see',
    '/design/open-core': '/engine/licensing',
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
  integrations: [
    starlight({
      title: 'Odal Node',
      description: 'EU Digital Product Passport infrastructure — open-source core, sovereign by design, built for ESPR compliance.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: {
        github: 'https://github.com/odal-node/dpp-core',
      },
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
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://docs.odal-node.io/favicon.svg' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '400' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '400' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://docs.odal-node.io/favicon.svg' } },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/introduction' },
            { label: 'Quick Start', link: '/quick-start' },
            { label: 'Core Concepts', link: '/core-concepts' },
            { label: 'What Odal can and cannot see', link: '/getting-started/what-odal-can-and-cannot-see' },
          ],
        },
        {
          label: 'The Core',
          collapsed: true,
          items: [
            { label: 'What the core does', link: '/core/overview' },
            // { label: 'Verify a passport yourself', link: '/core/verify' },
            { label: 'Standards & interoperability', link: '/core/standards' },
            { label: 'Security & cryptography', link: '/core/security' },
            { label: 'Extending: sectors & plugins', link: '/core/sectors' },
          ],
        },
        {
          label: 'The Engine',
          collapsed: true,
          items: [
            { label: 'How the node works', link: '/engine/architecture' },
            { label: 'Permanence & retention', link: '/engine/retention' },
            { label: 'Operating securely', link: '/engine/security' },
            { label: 'Self-Hosting', link: '/engine/self-hosted' },
            { label: 'The CLI', link: '/engine/cli' },
            // { label: 'Licensing', link: '/engine/licensing' },
          ],
        },
        {
          label: 'Regulatory Context',
          collapsed: true,
          items: [
            { label: 'ESPR Overview', link: '/regulatory/espr' },
            { label: 'Battery DPP', link: '/regulatory/battery' },
            { label: 'Textile DPP', link: '/regulatory/textile' },
            { label: 'Electronics DPP', link: '/regulatory/electronics' },
            { label: 'Access Control', link: '/regulatory/access-control' },
            { label: 'EU Central Registry', link: '/regulatory/central-registry' },
          ],
        },
        {
          label: 'API Reference',
          link: '/api',
          badge: { text: 'OpenAPI', variant: 'note' },
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
  vite: {
    plugins: [viteStaticCopy({ targets: [{ src: '../../public/brand', dest: '' }] })],
  },
  output: 'static',
});
