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
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://docs.odal-node.io/favicon.svg' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '400' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '400' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://docs.odal-node.io/favicon.svg' } },
      ],
      sidebar,
      customCss: ['./src/styles/custom.css'],
    }),
  ],
  output: 'static',
});
