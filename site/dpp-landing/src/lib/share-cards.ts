// share-cards.ts — what each page's share image says.
//
// A share image is the picture a link shows when it is pasted into a chat or a
// post. Each card repeats its page's eyebrow and headline, so a change to a
// page's headline should be made here too. Product groups and acts are read
// from the same records as their pages, so those cards cannot drift.
//
// A page with no card here keeps the site-wide image, public/og-image.png.
import { groups, unsoldGoods } from "./product-groups";
import { instruments, displayTitle, kindLabel, passportView } from "./regulations";

export type Card = {
  /** The page's path, as Astro.url.pathname gives it without a trailing slash. */
  path: string;
  eyebrow: string;
  title: string;
  line: string;
};

const pages: Card[] = [
  { path: "/lifecycle", eyebrow: "Lifecycle", title: "A passport is not a document. It is a record with a life.", line: "One record, eight stations, from the factory to the end of its life." },
  { path: "/visibility", eyebrow: "Visibility", title: "Each reader sees the part the law gives them.", line: "Who can read which part of a battery passport, and why." },
  { path: "/example-passport", eyebrow: "Example", title: "An example battery passport.", line: "Sorted into what anyone can read and what only some readers can." },
  { path: "/verify", eyebrow: "Verify", title: "Check a passport's proof file yourself.", line: "Signatures and history, checked in your browser. The file never leaves your machine." },
  { path: "/trust", eyebrow: "Data and trust", title: "What Odal Node can and cannot see.", line: "Why that holds by design rather than by promise." },
  { path: "/passport-check", eyebrow: "Passport check", title: "Does my product need a passport?", line: "Pick what you make or sell, and see which date applies and where it comes from." },
  { path: "/timeline", eyebrow: "Timeline", title: "When passports arrive, year by year.", line: "From batteries in 2027 to vehicles in 2032, with where every date comes from." },
  { path: "/regulations", eyebrow: "Regulations", title: "The EU acts behind the passports.", line: "Every act, the passport date it sets, and where that date comes from." },
  { path: "/build-on-odal", eyebrow: "Build on Odal", title: "Other people's compliance work, on nodes we do not run.", line: "Libraries, plugins and the licence line." },
  { path: "/roadmap", eyebrow: "Roadmap", title: "What is built, what is waiting, and what comes next.", line: "Capabilities, checked against the software itself." },
  { path: "/faq", eyebrow: "FAQ", title: "Questions people ask first.", line: "Which products need a passport, where your data lives and who can read it." },
  { path: "/glossary", eyebrow: "Glossary", title: "The words around a passport, explained.", line: "Product groups, delegated acts, legitimate interest, seals and more." },
  { path: "/security", eyebrow: "Security", title: "Report a security issue privately.", line: "How we respond, and how passports and signing keys are protected." },
  { path: "/privacy", eyebrow: "Privacy policy", title: "No cookies, no analytics, no trackers.", line: "What this website's host sees, and what you can ask of us." },
  { path: "/waitlist", eyebrow: "Waitlist", title: "Get ready for your products' passports.", line: "Tell us what you make, and hear when your product group is ready." },
  { path: "/repairers-and-recyclers", eyebrow: "For repairers and recyclers", title: "The parts of a passport made for your work.", line: "What you can read, and how to get the credential that opens it." },
  { path: "/authorities", eyebrow: "For authorities", title: "Check a passport without taking anyone's word for it.", line: "What authorities can read, and how to check a passport on your own." },
  { path: "/product-groups", eyebrow: "Product groups", title: "What the software can build passports for.", line: "What each passport carries, and who may read each part of it." },
];

const groupCards: Card[] = [...groups, unsoldGoods].map((g) => ({
  path: `/product-groups/${g.key}`,
  eyebrow: g.key === unsoldGoods.key ? "Also covered" : "Product group",
  title: g.name,
  line: g.line,
}));

const actCards: Card[] = instruments.map((i) => {
  const view = passportView(i);
  return {
    path: `/regulations/${i.id}`,
    eyebrow: kindLabel(i),
    title: displayTitle(i),
    line: `${view.label}. ${view.detail}`,
  };
});

export const cards: Card[] = [...pages, ...groupCards, ...actCards];

const byPath = new Map(cards.map((c) => [c.path, c]));

/** The image a page shares: its own card, or the site-wide image. */
export function shareImageFor(pathname: string): { src: string; alt: string } {
  const path = pathname.replace(/\/$/, "") || "/";
  const card = byPath.get(path);
  if (!card) return { src: "/og-image.png", alt: "Odal Node: Signed by you. Verified by anyone." };
  return { src: `/og${card.path}.png`, alt: `${card.eyebrow}: ${card.title}` };
}
