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
    'The plain-language website has its own index at https://odal-node.io/llms.txt. The API is also published as a machine-readable OpenAPI document, listed under "API Reference".',
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

  const rest = [...byLink.keys()].filter((link) => !listed.has(link)).sort();
  if (rest.length) parts.push('## Optional', '', ...rest.map(line), '');

  return new Response(parts.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
