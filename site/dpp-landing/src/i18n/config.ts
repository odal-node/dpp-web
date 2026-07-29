// i18n foundation — locale registry.
//
// Adding a language is a two-step, type-checked change: add its code here,
// then add its translations in `ui.ts`. TypeScript rejects a `ui.ts` missing
// any locale listed in `locales`, so the two files can't drift.
export const locales = ["en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Per-locale metadata for markup that isn't a translated string — `<html lang>`, `og:locale`. */
export const localeMeta: Record<Locale, { label: string; htmlLang: string; ogLocale: string }> = {
  en: { label: "English", htmlLang: "en", ogLocale: "en_US" },
};

/**
 * Narrow `Astro.currentLocale` (typed `string | undefined` by Astro, since it
 * reflects arbitrary URL segments) down to a known `Locale`, falling back to
 * the default. Prefer this over `Astro.currentLocale ?? defaultLocale` —
 * that expression still type-checks as plain `string`, which defeats
 * `localeMeta`/`ui`'s exhaustive `Record<Locale, ...>` lookups.
 */
export function resolveLocale(candidate: string | undefined): Locale {
  return (locales as readonly string[]).includes(candidate ?? "")
    ? (candidate as Locale)
    : defaultLocale;
}
