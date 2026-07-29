// Locale-correct pluralization — native `Intl.PluralRules`, no dependency.
//
// Not consumed anywhere yet: no current UI string needs it. Added now as
// foundation because the gap is real and easy to miss later — a flat
// `Record<Locale, string>` (as in ui.ts) cannot express "1 day left" vs
// "3 days left" correctly across locales (EN/DE/MK all pluralize
// differently), and the deadline-countdown style copy on the landing page
// is the first place that will need it once it's translated.
import type { Locale } from "./config";

type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/**
 * Pick the correct plural form for `count` in `locale`, substituting `{n}`
 * with the count.
 *
 * @example
 * pluralize("en", 1, { one: "{n} day left", other: "{n} days left" });
 * // => "1 day left"
 */
export function pluralize(locale: Locale, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(locale).select(count);
  const template = forms[rule] ?? forms.other;
  return template.replace("{n}", String(count));
}
