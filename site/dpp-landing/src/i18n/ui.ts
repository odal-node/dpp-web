// i18n foundation — the UI chrome string table (nav, footer, shared badges).
//
// Scope: shared-shell strings only (present on every page). Page-level prose
// (index.astro's sections, privacy.astro, the roadmap/deadlines/standards
// JSON) is a separate, larger migration — see docs/docs-web/WEB_CONTENT_STRATEGY.md
// — and is deliberately not moved here yet.
import type { Locale } from "./config";

export interface UIStrings {
  nav: {
    docs: string;
    trust: string;
    github: string;
    joinWaitlist: string;
    openMenu: string;
    closeMenu: string;
  };
  footer: {
    tagline: string;
    subtagline: string;
    projectHeading: string;
    dppCoreLink: string;
    dppEngineLink: string;
    privacyHeading: string;
    privacyPolicyLink: string;
    securityPolicyLink: string;
  };
  status: {
    alphaLabel: string;
  };
}

// `satisfies Record<Locale, UIStrings>` (not `: Record<Locale, UIStrings>`)
// so TypeScript still errors on a missing locale key, but keeps each locale's
// literal type — useful once a second locale needs its own key subset checked.
export const ui = {
  en: {
    nav: {
      docs: "Docs",
      trust: "Trust",
      github: "GitHub",
      joinWaitlist: "Join the waitlist",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    footer: {
      tagline: "Signed by you. Verified by anyone.",
      subtagline: "Sovereign Digital Product Passport infrastructure for EU ESPR.",
      projectHeading: "Project",
      dppCoreLink: "dpp-core on GitHub",
      dppEngineLink: "dpp-engine on GitHub",
      privacyHeading: "Privacy & security",
      privacyPolicyLink: "Privacy policy",
      securityPolicyLink: "Security policy",
    },
    status: {
      // Single source of truth for the alpha badge — previously duplicated
      // as two slightly different strings ("Alpha · Active development" in
      // Hero.astro vs "Alpha · in active development" in Nav.astro).
      alphaLabel: "Alpha · in active development",
    },
  },
} satisfies Record<Locale, UIStrings>;

export function useTranslations(locale: Locale): UIStrings {
  return ui[locale];
}
