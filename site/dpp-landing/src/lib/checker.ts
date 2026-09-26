// checker.ts — the answers behind /passport-check.
//
// One answer per choice, worked out at build time from the same records as
// /regulations and /timeline (passportView, the working plan), so the checker
// cannot say something those pages do not. The only facts added here are the
// battery types, from the Batteries Regulation Art. 77(1): a passport for each
// LMT battery, each industrial battery over 2 kWh, and each EV battery.
import timeline from "../data/timeline.json";
import { groups } from "./product-groups";
import { actsFor, instruments, passportView, shortTitle, type Instrument } from "./regulations";

export type Verdict = "yes" | "later" | "no";

export type Answer = {
  verdict: Verdict;
  headline: string;
  detail: string;
  basis?: "sourced" | "assumed";
  links: { href: string; label: string }[];
};

export type Choice = {
  key: string;
  label: string;
  answer?: Answer;
  /** A follow-up question whose options carry the answers instead. */
  follow?: { question: string; options: { key: string; label: string; answer: Answer }[] };
};

const plan = new Map(timeline.plan.groups.map((p) => [p.group, p.year]));
const copy = timeline.passports as Record<string, { detail: string }>;
const actLink = (i: Instrument) => ({ href: `/regulations/${i.id}`, label: shortTitle(i) });

/** The answer an act gives, read from its passport line. */
function fromAct(act: Instrument, groupLink?: { href: string; label: string }): Answer {
  const view = passportView(act);
  const links = [actLink(act), ...(groupLink ? [groupLink] : [])];
  switch (view.state) {
    case "required":
      return {
        verdict: "yes",
        headline: view.label.replace(/^Required/, "Yes, required"),
        detail: copy[act.id]?.detail ?? view.detail,
        basis: view.date?.basis,
        links,
      };
    case "undated":
    case "not-yet-operable":
      return { verdict: "later", headline: "Yes, but there is no date to act on yet", detail: view.detail, links };
    case "elsewhere":
      // The only system a record names is EPREL, the energy-label database.
      return { verdict: "no", headline: "No passport", detail: `${view.detail} Its other rules, such as the energy label, still apply.`, links };
    case "none":
      return { verdict: "no", headline: "No passport", detail: `The ${shortTitle(act)} sets rules for it, but creates no passport.`, links };
    default:
      return { verdict: "later", headline: view.label, detail: view.detail, links };
  }
}

function forGroup(key: string, name: string): Choice {
  const groupLink = { href: `/product-groups/${key}`, label: `${name} in Odal` };
  const acts = actsFor(key).map((a) => a.instrument);
  // An act of the group's own (batteries, toys, ...) answers before the framework.
  const own = acts.find((i) => i.kind !== "framework");
  const year = plan.get(key);

  if (key === "battery" && own) {
    const yes = fromAct(own, groupLink);
    const no: Answer = {
      verdict: "no",
      headline: "No passport for this type",
      detail: "The battery passport covers electric-vehicle, light-transport and industrial batteries over 2 kWh. The Batteries Regulation's other rules still apply.",
      links: [actLink(own), groupLink],
    };
    return {
      key,
      label: name,
      follow: {
        question: "What kind of battery?",
        options: [
          { key: "ev", label: "For an electric vehicle", answer: yes },
          { key: "lmt", label: "For light transport, such as an e-bike or e-scooter", answer: yes },
          { key: "industrial-large", label: "Industrial, over 2 kWh", answer: yes },
          { key: "industrial-small", label: "Industrial, 2 kWh or less", answer: no },
          { key: "portable", label: "Portable, such as for a phone or a power tool", answer: no },
          { key: "starter", label: "A vehicle's starter battery", answer: no },
        ],
      },
    };
  }
  if (own) return { key, label: name, answer: fromAct(own, groupLink) };
  if (year) {
    const espr = acts.find((i) => i.kind === "framework");
    return {
      key,
      label: name,
      answer: {
        verdict: "later",
        headline: "Not yet",
        detail: `The Commission plans the act that will set this group's rules and passport date for ${year}. Nothing is required before that act applies, which as a rule is at least 18 months after it comes into force.`,
        links: [...(espr ? [actLink(espr)] : []), groupLink, { href: "/timeline", label: "Timeline" }],
      },
    };
  }
  return {
    key,
    label: name,
    answer: { verdict: "no", headline: "No passport today", detail: "No act we follow requires one yet.", links: [groupLink] },
  };
}

const byId = (id: string) => {
  const i = instruments.find((x) => x.id === id);
  if (!i) throw new Error(`checker names instrument "${id}", which is not vendored`);
  return i;
};

export const choices: Choice[] = [
  ...groups.map((g) => forGroup(g.key, g.name)),
  { key: "vehicles", label: "Vehicles", answer: fromAct(byId("elv-2026-1738")) },
  { key: "packaging", label: "Packaging", answer: fromAct(byId("ppwr-2025-40")) },
  {
    key: "other",
    label: "Something else",
    answer: {
      verdict: "no",
      headline: "Not today, as far as we know",
      detail:
        "Passports arrive product group by product group, through acts the Commission adopts. No act we follow requires one for a product outside this list yet, and the regulations page lists every act we follow.",
      links: [
        { href: "/regulations", label: "Regulations" },
        { href: "/timeline", label: "Timeline" },
      ],
    },
  },
];
