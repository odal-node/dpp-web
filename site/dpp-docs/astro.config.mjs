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
      editLink: {
        // Docs content lives in THIS repo (dpp-web), not dpp-core.
        baseUrl: 'https://github.com/odal-node/dpp-web/edit/main/site/dpp-docs/',
      },
      favicon: '/favicon.svg',
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
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
  vite: {
    plugins: [viteStaticCopy({ targets: [{ src: '../../public/brand', dest: '' }] })],
  },
  output: 'static',
});
