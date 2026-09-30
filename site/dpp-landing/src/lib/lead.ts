// lead.ts — the one place the site builds an email to us.
//
// No form and no tracking (see /waitlist): a lead is an email someone chooses
// to send. The subject carries a tag in square brackets naming the page it was
// written from, visible to the sender, so replies can be counted by source
// without any script on the page. The body asks the same three things the
// waitlist page asks for.
export const MAILBOX = "contact@odal-node.io";

export type LeadSource = "home" | "check" | "checklist" | "waitlist";

const BODY = [
  "What we make, and which EU markets we sell into:",
  "",
  "",
  "How we keep product data today (spreadsheets, a product or ERP system, supplier documents):",
  "",
  "",
  "What we need first (a date we are working towards, a product group, a question):",
  "",
].join("\n");

/** A mailto link to us, from `source`, optionally about `topic` (a product, a group). */
export function mailto(source: LeadSource, topic?: string): string {
  const subject = `${["Odal Node", topic].filter(Boolean).join(": ")} [${source}]`;
  return `mailto:${MAILBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(BODY)}`;
}
