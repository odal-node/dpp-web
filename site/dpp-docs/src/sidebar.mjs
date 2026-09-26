// sidebar.mjs — the docs site's page order, in Starlight's sidebar format.
//
// Kept out of astro.config.mjs so /llms.txt can list the documentation in the
// same order and under the same headings as the sidebar, from one source.
export const sidebar = [
  {
    label: 'Getting Started',
    items: [
      { label: 'Introduction', link: '/introduction' },
      { label: 'Quick Start', link: '/quick-start' },
      { label: 'Core Concepts', link: '/core-concepts' },
      { label: 'What Odal can and cannot see', link: '/getting-started/what-odal-can-and-cannot-see' },
      { label: 'Licensing', link: '/getting-started/licensing' },
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
      { label: 'Product groups & plugins', link: '/core/sectors' },
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
      { label: 'Production deployment', link: '/engine/deployment' },
      { label: 'Configuration reference', link: '/engine/configuration' },
      { label: 'Backup, restore & key custody', link: '/engine/backup' },
      { label: 'Upgrading', link: '/engine/upgrading' },
      { label: 'The CLI', link: '/engine/cli' },
    ],
  },
  {
    label: 'Using the node',
    collapsed: true,
    items: [
      { label: 'Importing product data', link: '/guides/import' },
      { label: "A passport's lifecycle", link: '/guides/lifecycle' },
      { label: 'Handing over responsibility', link: '/guides/transfer' },
      { label: 'Proof files and verification', link: '/guides/verification' },
      { label: 'Access credentials', link: '/guides/credentials' },
      { label: 'Your operator identity', link: '/guides/operator-identity' },
      { label: 'Integrations and statistics', link: '/guides/integrations' },
      { label: 'Electronic seals', link: '/guides/seals' },
      { label: 'The unsold-goods disclosure', link: '/guides/unsold-goods' },
      { label: 'Webhook events', link: '/guides/webhook-events' },
      { label: 'Error reference', link: '/guides/errors' },
      { label: 'Troubleshooting', link: '/guides/troubleshooting' },
    ],
  },
  {
    label: 'Regulatory Context',
    collapsed: true,
    items: [
      { label: 'ESPR Overview', link: '/regulatory/espr' },
      { label: 'Battery DPP', link: '/regulatory/battery' },
      { label: 'Textile DPP', link: '/regulatory/textile' },
      { label: 'Toy DPP', link: '/regulatory/toys' },
      { label: 'Detergent DPP', link: '/regulatory/detergents' },
      { label: 'Construction product DPP', link: '/regulatory/construction' },
      { label: 'Vehicle passport', link: '/regulatory/vehicles' },
      { label: 'Phones and tablets', link: '/regulatory/phones' },
      { label: 'Access Control', link: '/regulatory/access-control' },
      { label: 'EU Central Registry', link: '/regulatory/central-registry' },
      { label: 'Acts and standards', link: '/regulatory/acts-and-standards' },
    ],
  },
  {
    label: 'API Reference',
    link: '/api',
    badge: { text: 'OpenAPI', variant: 'note' },
  },
];
