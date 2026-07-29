// The data-boundary facts (what Odal can see, cannot see, and could see but
// does not) — single-sourced. Before this package existed, the same facts
// were independently authored on odal-node.io/trust and on docs.odal-node.io's
// "What Odal can and cannot see" page, and had already drifted (a table
// header disagreed: "Managed" vs "Managed (Future)"). Both sites now render
// from these constants; only the depth of what they show differs.

export interface DataBoundaryRow {
  property: string;
  selfHosted: string;
  managed: string;
}

export const dataBoundaryByDeployment: DataBoundaryRow[] = [
  {
    property: "Node discards raw import files; retains the signed passport (all tiers)",
    selfHosted: "Yes — architectural invariant",
    managed: "Yes — architectural invariant",
  },
  {
    property: "Odal (the entity) can access stored data",
    selfHosted: "No — not present in the deployment",
    managed: "Constrained by access controls, audit logging, and contract",
  },
  {
    property: "Odal can sign on the operator's behalf",
    selfHosted: "No",
    managed: "No — the operator holds the signing keys",
  },
];

export interface DisclosureCategory {
  /** One-line landing-depth statement. */
  summary: string;
  /** Docs-depth detail — one or more paragraphs/bullets, most-detailed first. */
  detail: string[];
}

export const canSee: DisclosureCategory = {
  summary:
    "The signed passport you publish to a resolver we operate, and the metadata required to serve it.",
  detail: [
    "The GS1 Digital Link resolver cache",
    "The DID document (public by definition)",
    "The audit trail of signature and status transitions (managed deployments only)",
  ],
};

export const cannotSee: DisclosureCategory = {
  summary:
    "Your private keys (held in-process on your infrastructure), your raw production data, your supply-chain detail.",
  detail: [
    "Your private signing keys — held in-process on your infrastructure, encrypted at rest via Argon2id-derived AES-256-GCM, never transmitted",
    "Your raw production data, supply-chain detail beyond passport content, or import files",
    "In a self-hosted deployment: nothing at all — we have no access to the instance, the database, or the keys",
  ],
};

export const couldSeeButDoNot: DisclosureCategory = {
  summary: "The contents of your import files, which the node discards after validation.",
  detail: [
    "The contents of your import files. The software reads them once, validates the data, signs the passport, and discards the input. There is no setting, configuration, or internal code path that retains the raw import after signing — it is not a choice made per customer; it is how the software works.",
  ],
};
