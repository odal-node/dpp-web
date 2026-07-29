// i18n foundation — the UI chrome string table (nav, footer, shared badges).
//
// Scope: shared-shell strings only (present on every page). Page-level prose
// (index.astro's sections, privacy.astro, the roadmap/deadlines/standards
// JSON) is a separate, larger migration — see docs/docs-web/WEB_CONTENT_STRATEGY.md
// — and is deliberately not moved here yet. de/it/fr/es below are a first-pass
// translation of this chrome only; not yet reviewed by a native speaker —
// fine for these short, low-risk UI strings, but do not extend this practice
// to regulatory prose (citations, guarantees) without that review.
import type { Locale } from "./config";

export interface UIStrings {
  nav: {
    docs: string;
    trust: string;
    github: string;
    joinWaitlist: string;
    openMenu: string;
    closeMenu: string;
    language: string;
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
      language: "Language",
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
  de: {
    nav: {
      docs: "Dokumentation",
      trust: "Vertrauen",
      github: "GitHub",
      joinWaitlist: "Warteliste beitreten",
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
      language: "Sprache",
    },
    footer: {
      tagline: "Von Ihnen signiert. Von jedem verifizierbar.",
      subtagline: "Souveräne Infrastruktur für digitale Produktpässe gemäß EU-ESPR.",
      projectHeading: "Projekt",
      dppCoreLink: "dpp-core auf GitHub",
      dppEngineLink: "dpp-engine auf GitHub",
      privacyHeading: "Datenschutz & Sicherheit",
      privacyPolicyLink: "Datenschutzerklärung",
      securityPolicyLink: "Sicherheitsrichtlinie",
    },
    status: {
      alphaLabel: "Alpha · in aktiver Entwicklung",
    },
  },
  it: {
    nav: {
      docs: "Documentazione",
      trust: "Fiducia",
      github: "GitHub",
      joinWaitlist: "Iscriviti alla lista d'attesa",
      openMenu: "Apri il menu",
      closeMenu: "Chiudi il menu",
      language: "Lingua",
    },
    footer: {
      tagline: "Firmato da te. Verificabile da chiunque.",
      subtagline: "Infrastruttura sovrana per i passaporti digitali di prodotto ai sensi dell'ESPR UE.",
      projectHeading: "Progetto",
      dppCoreLink: "dpp-core su GitHub",
      dppEngineLink: "dpp-engine su GitHub",
      privacyHeading: "Privacy e sicurezza",
      privacyPolicyLink: "Informativa sulla privacy",
      securityPolicyLink: "Politica di sicurezza",
    },
    status: {
      alphaLabel: "Alpha · in sviluppo attivo",
    },
  },
  fr: {
    nav: {
      docs: "Documentation",
      trust: "Confiance",
      github: "GitHub",
      joinWaitlist: "Rejoindre la liste d'attente",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
      language: "Langue",
    },
    footer: {
      tagline: "Signé par vous. Vérifiable par tous.",
      subtagline: "Infrastructure souveraine pour les passeports numériques de produits au titre de l'ESPR de l'UE.",
      projectHeading: "Projet",
      dppCoreLink: "dpp-core sur GitHub",
      dppEngineLink: "dpp-engine sur GitHub",
      privacyHeading: "Confidentialité et sécurité",
      privacyPolicyLink: "Politique de confidentialité",
      securityPolicyLink: "Politique de sécurité",
    },
    status: {
      alphaLabel: "Alpha · en développement actif",
    },
  },
  es: {
    nav: {
      docs: "Documentación",
      trust: "Confianza",
      github: "GitHub",
      joinWaitlist: "Unirse a la lista de espera",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      language: "Idioma",
    },
    footer: {
      tagline: "Firmado por ti. Verificable por cualquiera.",
      subtagline: "Infraestructura soberana para pasaportes digitales de producto bajo el ESPR de la UE.",
      projectHeading: "Proyecto",
      dppCoreLink: "dpp-core en GitHub",
      dppEngineLink: "dpp-engine en GitHub",
      privacyHeading: "Privacidad y seguridad",
      privacyPolicyLink: "Política de privacidad",
      securityPolicyLink: "Política de seguridad",
    },
    status: {
      alphaLabel: "Alfa · en desarrollo activo",
    },
  },
} satisfies Record<Locale, UIStrings>;

export function useTranslations(locale: Locale): UIStrings {
  return ui[locale];
}
