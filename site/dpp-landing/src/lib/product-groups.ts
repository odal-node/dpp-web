// product-groups.ts — the one place pages read product groups from.
//
// Joins the manifests vendored from dpp-core (what the software models) with
// product-group-copy.json (how this site words it for a general reader), and
// turns raw category values and field names into labels. Pages never print a
// manifest key or field name directly.
import copy from "../data/product-group-copy.json";

export type Manifest = {
  key: string;
  title: string;
  productCategories?: string[];
  disclosure?: Record<string, string>;
};

export type Group = Manifest & { name: string; line: string };

const modules = import.meta.glob("../data/product-groups/*.json", { eager: true });
const manifests = new Map<string, Manifest>(
  Object.values(modules).map((m: any) => {
    const d = (m.default ?? m) as Manifest;
    return [d.key, d];
  }),
);

const words = copy.groups as Record<string, { name: string; line: string }>;

function toGroup(key: string): Group {
  const manifest = manifests.get(key);
  if (!manifest) throw new Error(`product-group-copy.json names "${key}", which has no manifest`);
  const w = words[key];
  if (!w) throw new Error(`manifest "${key}" has no wording in product-group-copy.json`);
  return { ...manifest, ...w };
}

/** The product groups, in the site's display order. Excludes unsold goods. */
export const groups: Group[] = copy.order.map(toGroup);

/** Unsold goods: modelled beside the groups, but not a product group. */
export const unsoldGoods: Group = toGroup("unsold-goods");

/** Every page that gets generated: the groups plus unsold goods. */
export const allPages: Group[] = [...groups, unsoldGoods];

// A manifest the wording file forgot would silently get no page and no menu
// entry. Fail the build instead.
for (const key of manifests.keys()) {
  if (!allPages.some((g) => g.key === key)) {
    throw new Error(`manifest "${key}" is missing from product-group-copy.json "order"`);
  }
}

function humanise(raw: string): string {
  const spaced = raw
    .replace(/Url$/, "")
    .replace(/Pct$/, " percentage")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const categoryLabel = (raw: string): string =>
  (copy.categoryLabels as Record<string, string>)[raw] ?? humanise(raw);

export const fieldLabel = (raw: string): string =>
  (copy.fieldLabels as Record<string, string>)[raw] ?? humanise(raw);
