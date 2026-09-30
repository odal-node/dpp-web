// checker-client.ts — the passport check's behaviour in the browser, shared by
// /passport-check and the picker in the home page's hero.
//
// The markup is rendered at build time: a root element `#<id>` holding a form
// `#<id>-form`, a first select `#<id>-group`, one `[data-follow]` block per
// follow-up question and one `[data-answer]` item per answer. Answers are
// hidden by page style until marked `data-shown`, never by the `hidden`
// attribute: Tailwind's reset hides `[hidden]` with !important inside a
// cascade layer, and a layered !important beats any unlayered override, so a
// <noscript> style could never reveal an answer that carried it.
//
// `syncHash` keeps the choice in the address so an answer can be shared. Only
// /passport-check does that; the home page's address stays clean, and its
// answers link to /passport-check for sharing instead.
export function mountChecker(id: string, { syncHash }: { syncHash: boolean }): void {
  const root = document.getElementById(id);
  const form = document.getElementById(`${id}-form`);
  const group = document.getElementById(`${id}-group`) as HTMLSelectElement | null;
  if (!root || !form || !group) return;

  const follows = [...root.querySelectorAll<HTMLElement>("[data-follow]")];
  const answers = [...root.querySelectorAll<HTMLElement>("[data-answer]")];
  const followSelect = (f: HTMLElement) => f.querySelector("select") as HTMLSelectElement;

  const show = () => {
    let key = group.value;
    for (const f of follows) {
      const on = f.dataset.follow === group.value;
      f.hidden = !on;
      if (on) key = followSelect(f).value ? `${group.value}:${followSelect(f).value}` : "";
    }
    for (const a of answers) a.toggleAttribute("data-shown", a.dataset.answer === key);
    if (syncHash) history.replaceState(null, "", key ? `#${key}` : location.pathname);
  };

  if (syncHash) {
    // An answer shared by its address opens on that answer. A mangled address
    // (a stray "%" that is not an escape) opens on the empty picker instead:
    // decodeURIComponent throws on it, and an uncaught throw here would leave
    // the picker with no listeners, so nothing could be chosen at all.
    let shared = "";
    try {
      shared = decodeURIComponent(location.hash.slice(1));
    } catch {
      /* not a valid escape sequence: ignore it */
    }
    const [g, sub] = shared.split(":");
    if (g && [...group.options].some((o) => o.value === g)) {
      group.value = g;
      const f = follows.find((x) => x.dataset.follow === g);
      if (f && sub) followSelect(f).value = sub;
    }
  }

  form.addEventListener("submit", (e) => e.preventDefault());
  group.addEventListener("change", show);
  for (const f of follows) followSelect(f).addEventListener("change", show);
  // A browser that restores form state (the back button) may bring a choice
  // back; show its answer rather than an empty card.
  show();
}
