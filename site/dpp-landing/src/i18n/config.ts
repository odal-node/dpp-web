// i18n foundation — locale registry.
//
// Adding a language is a two-step, type-checked change: add its code here,
// then add its translations in `ui.ts`. TypeScript rejects a `ui.ts` missing
// any locale listed in `locales`, so the two files can't drift.
export const locales = ["en", "de", "it", "fr", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Per-locale metadata for markup that isn't a translated string — `<html lang>`, `og:locale`. */
export const localeMeta: Record<Locale, { label: string; htmlLang: string; ogLocale: string }> = {
  en: { label: "English", htmlLang: "en", ogLocale: "en_US" },
  de: { label: "Deutsch", htmlLang: "de", ogLocale: "de_DE" },
  it: { label: "Italiano", htmlLang: "it", ogLocale: "it_IT" },
  fr: { label: "Français", htmlLang: "fr", ogLocale: "fr_FR" },
  es: { label: "Español", htmlLang: "es", ogLocale: "es_ES" },
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

/**
 * Strip a `/{locale}` prefix from a pathname, if present, for building a
 * cross-locale link — `astro:i18n`'s `getRelativeLocaleUrl(locale, path)`
 * expects an unprefixed `path` and will double-prefix otherwise (e.g.
 * switching from `/de/trust` to `it` would produce `/it/de/trust`).
 */
export function stripLocalePrefix(pathname: string, from: Locale): string {
  if (from === defaultLocale) return pathname;
  const prefix = `/${from}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
}
