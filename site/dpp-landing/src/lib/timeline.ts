// timeline.ts — the /timeline page's entries, year by year.
//
// Three sources, and each entry says which one it came from:
//
//   1. Passport dates: the instrument records vendored from dpp-core, worded
//      through passportView (lib/regulations.ts). Same dates as /regulations,
//      so the two pages cannot disagree.
//   2. Milestones: data/timeline.json, each with the article it rests on. Kept
//      to dates stated in a legal text.
//   3. The Commission's working plan: data/timeline.json again, but checked
//      at build time against the core record. A plan year the core record does
//      not state fails the build, so the site cannot hold a year the software
//      does not.
//
// A plan year is an indicative year for adopting an act, not a passport date.
// ESPR Art. 4(4) puts a product group's rules at least 18 months after its act
// enters into force, save in justified cases, and the page says so.
import data from "../data/timeline.json";
import {
  creatingPassports,
  instruments,
  passportView,
  shortTitle,
  groupRef,
  formatDate,
  type Instrument,
} from "./regulations";

export type Mark = "sourced" | "assumed" | "plan";

export type Entry = {
  /** ISO date, or a bare year for a plan entry. */
  when: string;
  whenText: string;
  title: string;
  detail: string;
  mark: Mark;
  source: string;
  href?: string;
  past: boolean;
};

const today = new Date().toISOString().slice(0, 10);

const actNumber = (i: Instrument) => i.title.match(/\(EU\)\s*\d{4}\/\d+/)?.[0];

// ── 1. passport dates ────────────────────────────────────────────────────────

// Per-act words only: which products, in a line. The date is never here.
const copy = data.passports as Record<string, { what: string; detail: string }>;

const passports: Entry[] = creatingPassports.flatMap((act) => {
  const view = passportView(act);
  // Only a date someone can act on. An act that has applied while the rules
  // its passport depends on do not exist ("not yet operable") goes under "No
  // date yet" with /regulations' own words, as the home page's cards do.
  if (!view.date || view.state !== "required") return [];
  const groups = (act.productGroups ?? []).map((b) => groupRef(b.productGroup).name);
  const what = copy[act.id]?.what ?? (groups.length ? groups.join(", ") : shortTitle(act));
  return [
    {
      when: view.date.iso,
      whenText: view.date.text,
      title: `${what}: passport required`,
      detail: copy[act.id]?.detail ?? `Under the ${shortTitle(act)}.`,
      mark: view.date.basis,
      source: actNumber(act) ? `Regulation ${actNumber(act)}` : shortTitle(act),
      href: `/regulations/${act.id}`,
      past: view.date.iso <= today,
    },
  ];
});

/** Acts that require a passport with no date anyone can act on yet. */
export const undated = creatingPassports
  .filter((act) => ["undated", "not-yet-operable"].includes(passportView(act).state))
  .map((act) => ({
    title: (act.productGroups ?? []).map((b) => groupRef(b.productGroup).name).join(", ") || shortTitle(act),
    act: shortTitle(act),
    detail: passportView(act).detail,
    href: `/regulations/${act.id}`,
  }));

// ── 2. milestones ────────────────────────────────────────────────────────────

const milestones: Entry[] = data.milestones.map((m) => ({
  when: m.date,
  whenText: formatDate(m.date),
  title: m.title,
  detail: m.detail,
  mark: "sourced",
  source: m.source,
  href: m.href,
  past: m.date <= today,
}));

// ── 3. the working plan ──────────────────────────────────────────────────────

const espr = instruments.find((i) => i.id === "espr");
const planNotes = new Map(
  ((espr?.productGroups ?? []) as { productGroup: string; notes?: string }[]).map((b) => [b.productGroup, b.notes ?? ""]),
);

const plan: Entry[] = data.plan.groups.map(({ group, year }) => {
  const notes = planNotes.get(group);
  if (notes === undefined) throw new Error(`timeline.json plans "${group}", which the ESPR record does not bind`);
  if (!/indicative/i.test(notes) || !notes.includes(year)) {
    throw new Error(`timeline.json gives "${group}" the plan year ${year}, which the ESPR record's notes do not state`);
  }
  const g = groupRef(group);
  return {
    when: year,
    whenText: `Planned for ${year}`,
    title: `${g.name}: Commission act planned`,
    detail: "The act that will set this group's rules and its passport date.",
    mark: "plan",
    source: data.plan.source,
    href: g.href,
    past: false,
  };
});

// ── by year ──────────────────────────────────────────────────────────────────

const all = [...passports, ...milestones, ...plan];

/** Within a year: dated entries first by date, then that year's plan entries. */
export const years: { year: string; entries: Entry[] }[] = [...new Set(all.map((e) => e.when.slice(0, 4)))]
  .sort()
  .map((year) => ({
    year,
    entries: all
      .filter((e) => e.when.startsWith(year))
      .sort((a, b) => (a.mark === "plan" ? 1 : 0) - (b.mark === "plan" ? 1 : 0) || a.when.localeCompare(b.when)),
  }));

export const planSource = data.plan.source;
