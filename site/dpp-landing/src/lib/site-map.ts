// site-map.ts — the one list of this site's pages.
//
// The nav, the footer, the /sitemap page and /llms.txt all read it, so a page
// listed here is reachable from all four and a page left out is reachable from
// none. That is how the audience pages and the accessibility statement ended
// up missing from the nav and footer: each list was kept by hand. The check at
// the bottom fails the build when a published page is in none of these lists.
//
// Menus, in bar order, each answer one question: "How it works" (what the
// software does), "Compliance" (what the law asks of a product, and of the
// people who read its passport), "Developers" (how to build on it) and
// "Resources" (is it ready, what does a word mean, how to report a flaw).
// "Product groups" follows them, built from lib/product-groups.

export type Entry = { href: string; label: string; line: string; icon: string; external?: boolean };
export type Menu = { id: string; label: string; items: Entry[] };

export const menus: Menu[] = [
  {
    id: "dd-how",
    label: "How it works",
    items: [
      {
        href: "/lifecycle",
        label: "Lifecycle",
        line: "Follow one passport from the factory to the end of its life",
        icon: '<path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
      },
      {
        href: "/visibility",
        label: "Visibility",
        line: "Who can read which part of a passport, and why",
        icon: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
      },
      {
        href: "/example-passport",
        label: "Example passport",
        line: "A complete battery passport, sorted by who may read it",
        icon: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
      },
      {
        href: "/verify",
        label: "Verify",
        line: "Check a passport's proof file in your browser",
        icon: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
      },
      {
        href: "/trust",
        label: "What Odal can see",
        line: "What stays on your node, and why that holds by design",
        icon: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      },
    ],
  },
  {
    id: "dd-compliance",
    label: "Compliance",
    items: [
      {
        href: "/passport-check",
        label: "Passport check",
        line: "Does your product need a passport, and from when",
        icon: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
      },
      {
        href: "/timeline",
        label: "Timeline",
        line: "When each passport is required, year by year",
        icon: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
      },
      {
        href: "/regulations",
        label: "Regulations",
        line: "The EU acts behind the passports, and when each applies",
        icon: '<path d="M12 3v18M5 21h14"/><path d="M5 7h14"/><path d="m5 7-2.5 6a2.5 2.5 0 0 0 5 0L5 7ZM19 7l-2.5 6a2.5 2.5 0 0 0 5 0L19 7Z"/>',
      },
      {
        href: "/repairers-and-recyclers",
        label: "For repairers and recyclers",
        line: "What you can read, and the credential that opens it",
        icon: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5L4 16.7 7.3 20l5.2-5.2a4 4 0 0 0 5-5.3l-2.4 2.4-2.6-.4-.4-2.6 2.4-2.4Z"/>',
      },
      {
        href: "/authorities",
        label: "For authorities",
        line: "What authorities can read, and checking a passport alone",
        icon: '<path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7"/><path d="M12 3 3 8h18l-9-5Z"/>',
      },
    ],
  },
  {
    id: "dd-developers",
    label: "Developers",
    items: [
      {
        href: "/build-on-odal",
        label: "Build on Odal",
        line: "Libraries, plugins and the licence line",
        icon: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M13.5 5l-3 14"/>',
      },
      {
        href: "https://docs.odal-node.io",
        label: "Documentation",
        line: "Install, run and operate a node",
        icon: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/>',
        external: true,
      },
      {
        href: "https://docs.odal-node.io/api",
        label: "API reference",
        line: "Every route a node serves",
        icon: '<path d="M8 4H7a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h1M16 4h1a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-1"/>',
        external: true,
      },
    ],
  },
  {
    id: "dd-resources",
    label: "Resources",
    items: [
      {
        href: "/glossary",
        label: "Glossary",
        line: "The words around a passport, explained",
        icon: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15Z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 8h6M9 11h4"/>',
      },
      {
        href: "/roadmap",
        label: "Roadmap",
        line: "What is built, what is waiting and what comes next",
        icon: '<path d="M5 21V4"/><path d="M5 4.5h11l-2 3.5 2 3.5H5"/>',
      },
      {
        href: "/security",
        label: "Security",
        line: "Report an issue, and how passports and keys are protected",
        icon: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="M12 8v5M12 16h.01"/>',
      },
      {
        href: "/accessibility",
        label: "Accessibility",
        line: "How this site was checked, and how to report a problem",
        icon: '<circle cx="12" cy="4.5" r="1.5"/><path d="M5 8.5c2.3.7 4.6 1 7 1s4.7-.3 7-1M12 9.5V14m0 0-3 7m3-7 3 7"/>',
      },
      {
        href: "/faq",
        label: "FAQ",
        line: "Short answers to the questions people ask first",
        icon: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7"/><path d="M12 17h.01"/>',
      },
    ],
  },
];

/** Pages reached from the footer's bottom line and the waitlist button rather than a menu. */
export const footerLinks: Entry[] = [
  { href: "/waitlist", label: "Join the waitlist", line: "Tell us what you make, and hear when your product group is ready", icon: "" },
  { href: "/privacy", label: "Privacy policy", line: "How this website handles your data", icon: "" },
  { href: "/sitemap", label: "Site map", line: "Every page on this site, in one list", icon: "" },
];

// ── the check ────────────────────────────────────────────────────────────────
// Every page file becomes a route. Dynamic routes are listed from their data
// (product groups, acts), underscore files are unpublished drafts, and the home
// page and 404 are reached by the logo and by any unknown address.
const listed = new Set([
  ...menus.flatMap((m) => m.items.map((e) => e.href)),
  ...footerLinks.map((e) => e.href),
  "/product-groups",
]);
const routes = Object.keys(import.meta.glob("../pages/**/*.astro"))
  .map((f) => f.replace("../pages", "").replace(/\.astro$/, "").replace(/\/index$/, "") || "/")
  .filter((r) => !r.includes("[") && !r.split("/").some((s) => s.startsWith("_")) && r !== "/" && r !== "/404");
const missing = routes.filter((r) => !listed.has(r));
if (missing.length) {
  throw new Error(`site-map.ts: these pages are in no menu or footer list: ${missing.join(", ")}`);
}
