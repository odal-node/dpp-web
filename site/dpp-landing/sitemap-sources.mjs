// sitemap-sources.mjs — which files each page's content comes from, so the
// sitemap's <lastmod> moves when that content changes (scripts/git-lastmod.mjs).
//
// Every page counts its own file under src/pages. Pages whose words live in a
// data file or a helper also count those, listed below. Shared chrome (the
// layout, nav and footer) is left out on purpose: a new menu item is not a
// change to what a page says, and counting it would move every date at once.
// A page added later needs no entry unless its content lives elsewhere.
import { fileURLToPath } from "node:url";
import { lastCommitDate } from "../../scripts/git-lastmod.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));

const regulations = ["src/lib/regulations.ts", "src/components/ActCard.astro", "src/components/BasisMark.astro"];

const extra = {
  "/": [
    "src/components/Hero.astro",
    "src/components/DeadlineCards.astro",
    "src/components/StandardsRow.astro",
    "src/data/standards.json",
    "src/data/instruments",
  ],
  "/lifecycle/": ["src/data/stations.json"],
  "/visibility/": ["src/data/access.json"],
  "/roadmap/": ["src/data/roadmap.json", "src/components/Roadmap.astro", "src/components/StatusBadge.astro"],
  "/faq/": ["src/data/faq.json"],
  "/glossary/": ["src/data/glossary.json"],
  "/example-passport/": ["src/data/example-passport.json", "src/data/product-group-copy.json"],
  "/timeline/": ["src/data/timeline.json", "src/lib/timeline.ts", "src/data/instruments", ...regulations],
  "/passport-check/": ["src/lib/checker.ts", "src/data/instruments", "src/data/product-groups", ...regulations],
  "/regulations/": ["src/data/instruments", "src/data/applied-acts.json", ...regulations],
  "/product-groups/": ["src/data/product-groups", "src/data/product-group-copy.json", "src/lib/product-groups.ts"],
  "/verify/": ["src/lib/verify", "public/verify/examples"],
  "/sitemap/": ["src/lib/site-map.ts"],
};

/** The files behind one URL path, such as "/regulations/espr/". */
function sources(pathname) {
  const slug = pathname.replace(/^\/|\/$/g, "");
  const [section, key, sub] = slug.split("/");
  if (section === "regulations" && key) {
    return ["src/pages/regulations/[id].astro", `src/data/instruments/${key}.json`, ...regulations];
  }
  if (section === "product-groups" && key && sub === "checklist") {
    return [
      "src/pages/product-groups/[key]/checklist.astro",
      `src/data/product-groups/${key}.json`,
      "src/data/product-group-copy.json",
      "src/data/readiness.json",
      "src/data/access.json",
      "src/lib/checker.ts",
      "src/lib/product-groups.ts",
      "src/data/instruments",
      ...regulations,
    ];
  }
  if (section === "product-groups" && key) {
    return [
      "src/pages/product-groups/[key].astro",
      `src/data/product-groups/${key}.json`,
      "src/data/product-group-copy.json",
      "src/lib/product-groups.ts",
    ];
  }
  const page = slug ? [`src/pages/${slug}.astro`, `src/pages/${slug}/index.astro`] : ["src/pages/index.astro"];
  return [...page, ...(extra[pathname] ?? [])];
}

export const lastmodFor = (pathname) => lastCommitDate(root, sources(pathname));
