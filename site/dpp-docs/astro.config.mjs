import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.odal-node.io',
  // Renamed pages keep their old URLs working.
  redirects: {
    // Design pages removed; redirect to the closest living equivalent.
    '/design/no-touch-data': '/getting-started/what-odal-can-and-cannot-see',
    '/design/proof-bound': '/getting-started/what-odal-can-and-cannot-see',
    '/design/open-core': '/getting-started/licensing',
    // Licensing moved out of the engine section; the open-core split describes
    // both parts, so it belongs with orientation rather than with the service.
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
            // Last in orientation rather than under The Engine: the open-core
            // split covers both parts, so it is not an engine-specific topic.
            { label: 'Licensing', link: '/getting-started/licensing' },
          ],
        },
        {
          label: 'The Core',
          collapsed: true,
          items: [
            { label: 'What the core does', link: '/core/overview' },
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
          ],
        },
        {
          label: 'Regulatory Context',
          collapsed: true,
          items: [
            { label: 'ESPR Overview', link: '/regulatory/espr' },
            { label: 'Battery DPP', link: '/regulatory/battery' },
            { label: 'Textile DPP', link: '/regulatory/textile' },
            // Electronics DPP is withdrawn pending a rewrite — its source is
            // `_electronics.mdx`, which the underscore keeps out of the content
            // collection. Restore this entry with the page, not before it.
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
  output: 'static',
});
