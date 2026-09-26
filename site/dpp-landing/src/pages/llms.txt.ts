// /llms.txt — this site's pages as a plain-text index for AI agents and other
// automated readers, in the llms.txt format (https://llmstxt.org): a title, a
// one-paragraph summary, then sections of links with a line each. Built from
// the same lists as the nav, the footer and /sitemap, so it cannot drift from
// them. Links are absolute, to the production site, because the file describes
// the published site wherever it is read from.
import type { APIRoute } from "astro";
import { menus, footerLinks } from "../lib/site-map";
import { groups, unsoldGoods } from "../lib/product-groups";
import { instruments, displayTitle, passportView } from "../lib/regulations";

export const GET: APIRoute = ({ site }) => {
  const abs = (href: string) => (/^https?:\/\//.test(href) ? href : new URL(href, site).toString());
  const item = (href: string, label: string, line: string) => `- [${label}](${abs(href)}): ${line}`;

  const parts = [
    "# Odal Node",
    "",
    "> Self-hosted infrastructure for EU Digital Product Passports (DPP) under the Ecodesign for Sustainable Products Regulation (ESPR) and the Batteries Regulation, built on an open-source core. A company runs its own node, validates and signs its passports with its own keys under its own web domain, and anyone can verify a passport without Odal.",
    "",
    "This file indexes odal-node.io, the plain-language website. The technical documentation, including the node's HTTP API, has its own index at https://docs.odal-node.io/llms.txt. Nobody runs Odal Node in production yet; the roadmap page says what is built.",
    "",
    ...menus.flatMap((m) => [`## ${m.label}`, "", ...m.items.map((e) => item(e.href, e.label, e.line)), ""]),
    "## Product groups",
    "",
    item("/product-groups", "All product groups", "What the software can build passports for"),
    ...[...groups, unsoldGoods].map((g) => item(`/product-groups/${g.key}`, g.name, g.line)),
    "",
    "## EU acts",
    "",
    ...instruments.map((i) => item(`/regulations/${i.id}`, displayTitle(i), `${passportView(i).label}. ${passportView(i).detail}`)),
    "",
    "## Optional",
    "",
    ...footerLinks.map((e) => item(e.href, e.label, e.line)),
    item("/sitemap-index.xml", "XML sitemap", "Every page, for search engines"),
    "",
  ];
  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
