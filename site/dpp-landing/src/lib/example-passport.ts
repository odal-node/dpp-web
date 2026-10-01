// example-passport.ts — the example battery passport, sorted by who may read
// each part. Shared by /example-passport (every field) and the home page's
// passport preview (a few fields per part), so the two cannot sort a field
// differently.
//
// The data is the engine's own demo EV battery (fictional company), copied with
// provenance into src/data/example-passport.json. The sorting uses the battery
// disclosure map vendored from dpp-core, the same map the software and
// /visibility use: a field it does not list is public.
import { categoryLabel, fieldLabel } from "./product-groups";
import battery from "../data/product-groups/battery.json";
import example from "../data/example-passport.json";

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export const passport = example.passport as unknown as Record<string, Json> & { productGroupData: Record<string, Json> };
const disclosure = (battery as { disclosure: Record<string, string> }).disclosure;

// The envelope fields every passport carries, then the battery's own data.
const envelope: [string, Json][] = [
  ["productName", passport.productName],
  ["manufacturer", passport.manufacturer],
  ["batchId", passport.batchId],
  ["placedOnMarketDate", passport.placedOnMarketDate],
  ["commodityCode", passport.commodityCode],
  ["materials", passport.materials],
];
const groupData = Object.entries(passport.productGroupData).filter(([k]) => k !== "productGroup");

const classOf = (field: string) => disclosure[field] ?? "public";

/** Every field, by disclosure class: public, restricted, conformity, individual. */
export const buckets: Record<string, [string, Json][]> = { public: [...envelope], restricted: [], conformity: [], individual: [] };
for (const [k, v] of groupData) (buckets[classOf(k)] ??= []).push([k, v]);

export const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);
export const scalar = (v: Json) =>
  v === true ? "Yes" : v === false ? "No" : typeof v === "number" ? v.toLocaleString("en-GB") : String(v);

// Fields whose value is a code from a fixed list, shown by its label rather
// than as the raw code ("electricVehicle" reads "Electric vehicle").
const CODED = new Set(["batteryType", "batteryStatus", "parameterSet"]);

/** One field's value for a reader: a year without a thousands separator, a code by its label. */
export const shown = (key: string, v: Json) =>
  typeof v === "number" && key.endsWith("Year")
    ? String(v)
    : typeof v === "string" && CODED.has(key)
      ? categoryLabel(v)
      : scalar(v);
export const flat = (o: Record<string, Json>) =>
  Object.entries(o)
    .filter(([, v]) => v !== null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${fieldLabel(k)}: ${Array.isArray(v) ? `${v.length} entries` : isObj(v) ? "…" : shown(k, v)}`)
    .join(" · ");

/** The Annex XIII point each disclosure class holds (Batteries Regulation, Art. 77(2)). */
const POINT: Record<string, string> = { public: "1", restricted: "2", conformity: "3", individual: "4" };

/**
 * A few fields per part for the home page's preview, read from the same data
 * and sorted by the same map. A field named here that the data no longer
 * carries, or that the map puts in another part, fails the build rather than
 * showing a wrong value or a field under the wrong reader.
 */
const PICKS: Record<string, string[]> = {
  public: ["batteryChemistry", "ratedCapacityKwh", "expectedLifetimeCycles"],
  restricted: ["cathodeMaterial", "componentPartNumbers"],
  conformity: ["testReportResults"],
  individual: ["batteryStatus", "usageHistory"],
};

/** A short, readable value: lists name their first item and count the rest. */
function brief(key: string, v: Json): string {
  if (key === "usageHistory" && isObj(v) && typeof v.chargeDischargeCycles === "number") {
    return `${v.chargeDischargeCycles} charge and discharge cycles so far`;
  }
  if (Array.isArray(v)) {
    const first = v[0];
    const name = isObj(first) ? String(first.name ?? "") : scalar(first as Json);
    return v.length > 1 ? `${name} and ${v.length - 1} more` : name;
  }
  if (typeof v === "string") return v.charAt(0).toUpperCase() + v.slice(1);
  return scalar(v);
}

export type PreviewPart = { cls: string; point: string; fields: { label: string; value: string }[] };

export const previewParts: PreviewPart[] = Object.entries(PICKS).map(([cls, keys]) => ({
  cls,
  point: POINT[cls],
  fields: keys.map((k) => {
    const hit = (buckets[cls] ?? []).find(([key]) => key === k);
    if (!hit) throw new Error(`example-passport: "${k}" is not in the ${cls} part of the example passport`);
    const label = k === "usageHistory" ? "Use so far" : fieldLabel(k);
    return { label, value: brief(k, hit[1]) };
  }),
}));
