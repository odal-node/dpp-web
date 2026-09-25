// regulations.ts — the one place pages read the legal acts from.
//
// The acts are the instrument records vendored from dpp-core (see
// core-source.json). This module only *words* them for a general reader; it
// never adds a fact. Every date on /regulations comes from these records, so
// the site and the software cannot disagree about one.
//
// THE ONE RULE THIS FILE ENFORCES
//
// A passport is shown as required only when the act requires one AND at least
// one product group it reaches is binding now. That is the core catalog's own
// "live obligation" fold (dpp-domain `InstrumentCatalog`): an act can require a
// passport on paper while nothing about it can be met yet, and a page that
// printed its date alone would tell a manufacturer they are already in breach.
import { groups, unsoldGoods, categoryLabel } from "./product-groups";

type Basis = "sourced" | "assumed";

type Passport =
  | { obligation: "required"; from?: { date: string; basis: Basis } }
  | { obligation: "notRequired" }
  | { obligation: "displacedBy"; system: string; basis?: string };

type Binding = {
  productGroup: string;
  status: "in_force" | "provisional" | string;
  legalBasis?: string[];
  passport?: Passport;
};

export type Instrument = {
  id: string;
  title: string;
  celex?: string;
  kind: "framework" | "direct" | "delegated" | "implementing" | "adjacent" | string;
  status: "adopted" | "anticipated" | string;
  currency?: { state: string; asOf?: string; checkedOn?: string };
  passport: Passport;
  parent?: string;
  productGroups?: Binding[];
};

const modules = import.meta.glob("../data/instruments/*.json", { eager: true });
const all: Instrument[] = Object.values(modules).map((m: any) => (m.default ?? m) as Instrument);
const byId = new Map(all.map((i) => [i.id, i]));

// ── words ────────────────────────────────────────────────────────────────────

/** Vendored titles are verbatim from core; the site's copy uses no em dashes. */
export const displayTitle = (i: Instrument) => i.title.replace(/\s+—\s+/g, ": ");

const KIND: Record<string, string> = {
  framework: "Framework regulation",
  direct: "Regulation",
  delegated: "Delegated act",
  implementing: "Implementing act",
  adjacent: "Related act",
};
export const kindLabel = (i: Instrument) => KIND[i.kind] ?? "Legal act";

export const statusLabel = (i: Instrument) => (i.status === "anticipated" ? "Expected" : "Adopted");

export const basisLabel = (b: Basis) => (b === "sourced" ? "From the text" : "Our assumption");

const SYSTEM: Record<string, string> = {
  EPREL: "EPREL, the EU's energy-label database",
};

export const bindingLabel = (status: string) =>
  status === "in_force" ? "Binding now" : status === "provisional" ? "Not yet determinable" : "Tracked only";

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// ── the passport line ────────────────────────────────────────────────────────

export type PassportView = {
  /** Short state, for a chip. */
  state: "required" | "not-yet-operable" | "per-act" | "expected" | "none" | "elsewhere";
  label: string;
  /** One plain sentence expanding the label. */
  detail: string;
  date?: { iso: string; text: string; basis: Basis };
};

const today = new Date().toISOString().slice(0, 10);

export function passportView(i: Instrument): PassportView {
  const p = i.passport;
  if (p.obligation === "notRequired") {
    return { state: "none", label: "No passport", detail: "This act shapes what is recorded, but creates no passport of its own." };
  }
  if (p.obligation === "displacedBy") {
    return {
      state: "elsewhere",
      label: "Handled elsewhere",
      detail: `Its product information is held in ${SYSTEM[p.system] ?? p.system} rather than in a passport.`,
    };
  }
  if (i.status === "anticipated") {
    return { state: "expected", label: "Expected", detail: "Not adopted yet. There is no text, so there is no date." };
  }

  const live = (i.productGroups ?? []).some((b) => b.status === "in_force");
  const from = p.from;
  if (!from) {
    return {
      state: "per-act",
      label: "Set act by act",
      detail: "This framework requires passports, but each product group's own act sets the date.",
    };
  }
  const date = { iso: from.date, text: formatDate(from.date), basis: from.basis };
  if (!live && from.date <= today) {
    return {
      state: "not-yet-operable",
      label: "Not yet operable",
      detail: `The act has applied since ${date.text}, but the rules it depends on have not been adopted, so the passport cannot be issued under it yet.`,
      date,
    };
  }
  return {
    state: "required",
    label: from.date <= today ? `Required since ${date.text}` : `Required from ${date.text}`,
    detail: "Products in scope need a passport from this date.",
    date,
  };
}

// ── product groups ───────────────────────────────────────────────────────────

const known = new Map([...groups, unsoldGoods].map((g) => [g.key, g.name]));

/** A binding may name a group the site has no page for (the law reaches it, we model no schema). */
export const groupRef = (key: string) => ({
  key,
  name: known.get(key) ?? categoryLabel(key),
  href: known.has(key) ? `/product-groups/${key}` : undefined,
});

// ── lists ────────────────────────────────────────────────────────────────────

export const eurLex = (celex: string) => `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`;

export const parentOf = (i: Instrument) => (i.parent ? byId.get(i.parent) : undefined);

/** Every act, ordered: passport-creating acts first by date, then the rest by title. */
export const instruments: Instrument[] = [...all].sort((a, b) => {
  const rank = (i: Instrument) => (i.passport.obligation === "required" ? 0 : 1);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  const da = a.passport.obligation === "required" ? a.passport.from?.date ?? "9999" : "9999";
  const db = b.passport.obligation === "required" ? b.passport.from?.date ?? "9999" : "9999";
  return da.localeCompare(db) || displayTitle(a).localeCompare(displayTitle(b));
});

export const creatingPassports = instruments.filter((i) => i.passport.obligation === "required");
export const shapingPassports = instruments.filter((i) => i.passport.obligation !== "required");

/** The acts that reach one product group, with the binding for it. */
export const actsFor = (group: string) =>
  instruments.flatMap((i) =>
    (i.productGroups ?? []).filter((b) => b.productGroup === group).map((binding) => ({ instrument: i, binding })),
  );
