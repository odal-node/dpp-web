// The signing pipeline (import → validate → sign → publish → verify) —
// single-sourced. Previously reworded independently on the landing page (4
// steps, no "Verify"), on odal-node.io/trust (5 steps), and in docs (5
// steps) — the step count itself disagreed between landing and docs.

export interface MechanismStep {
  /** Short label — used by both the landing timeline and the docs list. */
  label: string;
  /** Landing-depth one-line description. */
  summary: string;
  /** Docs-depth description. */
  detail: string;
}

export const mechanismSteps: MechanismStep[] = [
  {
    label: "Import",
    summary: "Product data from CSV, Excel, or your ERP into your own node.",
    detail:
      "Product data arrives at your node — CSV, Excel, or ERP export. This happens on infrastructure you control.",
  },
  {
    label: "Validate",
    summary: "Against versioned sector schemas tracking the regulation, locally.",
    detail:
      "Locally against versioned sector schemas. Validation is a pure function — no network calls.",
  },
  {
    label: "Sign",
    summary: "With your own key, generated and held on your infrastructure.",
    detail:
      "Your Ed25519 private key, generated and held in-process, signs the validated passport into a JWS bound to your did:web identity.",
  },
  {
    label: "Publish",
    summary: "Only the signed passport becomes resolvable, via QR and GS1 Digital Link.",
    detail:
      "The signed passport becomes resolvable; the raw import files are discarded. Public fields are served to anyone, restricted tiers only against a verified credential.",
  },
  {
    label: "Verify",
    summary:
      "Any consumer, authority, or recycler verifies the signature against your public DID document — without Odal in the loop.",
    detail: "Anyone verifies against your public DID Document. Odal is not in the verify loop.",
  },
];
