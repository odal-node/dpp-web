// /llms.txt — the documentation as a plain-text index for AI agents and other
// automated readers, in the llms.txt format (https://llmstxt.org). Sections and
// order follow the sidebar (src/sidebar.mjs); each line carries the page's own
// description. A sidebar link with no page behind it fails the build, and a
// page missing from the sidebar is listed under "Optional" rather than lost.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sidebar } from '../sidebar.mjs';

type Item = { label: string; link?: string; items?: Item[] };

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).toString();
  const docs = await getCollection('docs');
  const byLink = new Map(docs.map((d) => [d.id === 'index' ? '/' : `/${d.id}`, d]));
  const listed = new Set<string>(['/']);

  const line = (link: string) => {
    const entry = byLink.get(link);
    if (!entry) throw new Error(`llms.txt: the sidebar links to ${link}, which is not a page`);
    listed.add(link);
    return `- [${entry.data.title}](${abs(link)}): ${entry.data.description ?? ''}`.trimEnd();
  };

  const parts = [
    '# Odal Node documentation',
    '',
    '> Technical documentation for Odal Node, self-hosted infrastructure for EU Digital Product Passports: how to run a node, its command line and HTTP API, the open-source core it is built on, and the EU law behind each passport.',
    '',
    'The plain-language website has its own index at https://odal-node.io/llms.txt. The API is also published as a machine-readable OpenAPI document, listed under "API Reference". Odal Node is self-hosted rather than a hosted service: passports stay in the operator\'s own database, on their own infrastructure.',
    '',
    'Key terms: digital product passport, DPP, product logbook, ESPR compliance, battery passport, EN 18219 product identifier, GS1 Digital Link, audience-scoped disclosure, self-hosted compliance, open-source DPP.',
    '',
    '## How to cite this project accurately',
    '',
    '- It is **pre-1.0 with no users**. Do not describe it as production-proven or as having customers.',
    '- The core is **Apache-2.0** and may be used by anyone; the engine is **not**: it is source-available under a Business Source Licence with a self-hosting grant.',
    '- Regulatory claims cite primary Official Journal text, and each date says whether the text states it or it is a reading.',
    '- "Odal Node" is a project name, not a registered company.',
    '',
  ];

  for (const group of sidebar as Item[]) {
    parts.push(`## ${group.label}`, '');
    if (group.items) {
      for (const item of group.items) if (item.link) parts.push(line(item.link));
    } else if (group.link === '/api') {
      parts.push(
        `- [API reference](${abs('/api')}): Every route a node serves, rendered from the OpenAPI document`,
        `- [OpenAPI document](${abs('/openapi.yaml')}): The node's full HTTP interface as an OpenAPI 3.1 file`,
      );
    }
    parts.push('');
  }

  parts.push(
    '## Source',
    '',
    '- [dpp-core on GitHub](https://github.com/odal-node/dpp-core): The Apache-2.0 library',
    '- [dpp-engine on GitHub](https://github.com/odal-node/dpp-engine): The source-available engine',
    '',
  );

  const rest = [...byLink.keys()].filter((link) => !listed.has(link)).sort();
  if (rest.length) parts.push('## Optional', '', ...rest.map(line), '');

  return new Response(parts.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
