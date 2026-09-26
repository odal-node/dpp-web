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

/** "Batteries Regulation (EU) 2023/1542" → "Batteries Regulation", for cards. */
export const shortTitle = (i: Instrument) =>
  displayTitle(i).replace(/\s*\(EU\).*$/, "").replace(/:.*$/, "");

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

/**
 * What a status check found, for a general reader. The record's `checkedOn` is
 * the date someone confirmed the act is still law (dpp-domain `CurrencyCheck`),
 * not a date anyone re-read its content, so the words must not claim more.
 */
export const currencyLine = (i: Instrument) => {
  const c = i.currency;
  if (!c) return i.status === "anticipated" ? "Not adopted, so there is nothing to check yet." : "Not yet confirmed to be in force.";
  const on = c.checkedOn ? ` Last confirmed on EUR-Lex on ${formatDate(c.checkedOn)}.` : "";
  // "consolidated" is not read as "amended": ESPR's record is consolidated as
  // of its own publication day and the act has never been amended.
  return c.state === "repealed" ? `Repealed.${on}` : `In force.${on}`;
};

/**
 * Whether the act asks for a passport for this group: the binding's own answer
 * where it gives one, the act's otherwise (dpp-domain `requires_passport_for`).
 * ESPR's unsold-goods binding is the case: the framework requires passports,
 * its disclosure duty does not.
 */
export const bindingRequiresPassport = (i: Instrument, b: Binding) =>
  (b.passport ?? i.passport).obligation === "required";

/** A binding that cites no article rests on no legal text, only on preparatory work. */
export const restsOnLaw = (b: Binding) => (b.legalBasis ?? []).length > 0;

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
  state: "required" | "not-yet-operable" | "undated" | "per-act" | "expected" | "none" | "elsewhere";
  label: string;
  /** One plain sentence expanding the label. */
  detail: string;
  date?: { iso: string; text: string; basis: Basis };
};

const today = new Date().toISOString().slice(0, 10);

export function passportView(i: Instrument): PassportView {
  const p = i.passport;
  if (p.obligation === "notRequired") {
    return { state: "none", label: "No passport", detail: "It sets other rules, but creates no passport." };
  }
  if (p.obligation === "displacedBy") {
    return {
      state: "elsewhere",
      label: "Handled elsewhere",
      detail: `Its product information goes into ${SYSTEM[p.system] ?? p.system}, instead of a passport.`,
    };
  }
  if (i.status === "anticipated") {
    return { state: "expected", label: "Expected", detail: "Not adopted yet. There is no text, so there is no date." };
  }

  const live = (i.productGroups ?? []).some((b) => b.status === "in_force");
  const from = p.from;
  if (!from && i.kind === "framework") {
    // ESPR Art. 9(1): a passport is owed "in accordance with the applicable
    // delegated acts", so the framework alone requires one of nothing.
    return {
      state: "per-act",
      label: "Set act by act",
      detail: "A product needs a passport only once a Commission act covers it, and that act sets the date.",
    };
  }
  if (!from) {
    // A direct act that requires a passport but fixes no date for it. The
    // record leaves the date out rather than inventing one (dpp-domain
    // `ObligationDate`), and so does the page.
    return {
      state: "undated",
      label: "Date not set yet",
      detail: "The act requires a passport, but leaves when to a later Commission act that has not been adopted yet.",
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
    // "Subject to any transition": the Detergents Regulation Art. 36(2) lets
    // products that meet the old rules be placed on the market for a year
    // after its date. The records carry no transition periods, so the page
    // names the possibility rather than stating none exists.
    detail: "Products in scope need a passport from this date, subject to any transition period the act allows.",
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

/**
 * Every passport obligation that carries a date and can be met under its act:
 * the home page's deadline cards. An act whose date has passed while nothing it
 * depends on exists ("not yet operable") is left out on purpose; it is not a
 * deadline anyone can act on.
 */
export const datedPassports = creatingPassports
  .map((act) => ({ act, view: passportView(act) }))
  .filter(({ view }) => view.state === "required" && view.date);
export const shapingPassports = instruments.filter((i) => i.passport.obligation !== "required");

/** The acts that reach one product group, with the binding for it. */
export const actsFor = (group: string) =>
  instruments.flatMap((i) =>
    (i.productGroups ?? []).filter((b) => b.productGroup === group).map((binding) => ({ instrument: i, binding })),
  );
