// dossier.ts — read an evidence dossier exactly as the node's Rust types do.
//
// The node deserialises a dossier into typed structs (dpp-types `DossierV1`,
// dpp-domain `TransferRecord`, …) and re-serialises them for two of its
// checks. Verifying the same file here means reproducing that round trip:
//
//   - Strict types (`deny_unknown_fields`) refuse an unknown key: the dossier,
//     its manifest, both signed views and every audit entry. That is a
//     malformed file, not a failed check.
//   - Tolerant types silently drop an unknown key: the transfer chain, each
//     transfer, each operator. The drop is what `input_fidelity` exists to
//     catch, so this module drops it too.
//   - Re-serialising normalises: UUIDs become lowercase hyphenated, timestamps
//     become chrono's UTC form, an absent `Option` without `skip_serializing_if`
//     becomes `null`, one with it disappears.
//
// Anything this module cannot reproduce exactly (an integer beyond 2^53,
// which JavaScript cannot hold) is reported as unsupported rather than
// guessed at. A verifier that is sometimes silently wrong is worse than one
// that says where its reach ends.
import type { Json } from "./canonical.ts";

type Obj = { [key: string]: Json };

export class Malformed extends Error {}
export class Unsupported extends Error {}

// ── raw-text scan: what JSON.parse hides ─────────────────────────────────────

type Path = (string | number)[];

/**
 * Walk the raw text for the two things JSON.parse erases: integers too large
 * to hold exactly, and duplicate keys (JSON.parse keeps the last; a Rust
 * struct refuses a repeated field).
 */
function scan(text: string): { unsafeInteger: boolean; duplicates: { path: Path; key: string }[] } {
  let i = 0;
  let unsafeInteger = false;
  const duplicates: { path: Path; key: string }[] = [];
  const ws = () => {
    while (i < text.length && " \t\n\r".includes(text[i])) i++;
  };
  const str = (): string => {
    const start = i;
    i++;
    while (text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
    i++;
    return JSON.parse(text.slice(start, i));
  };
  const value = (path: Path): void => {
    ws();
    const c = text[i];
    if (c === "{") {
      i++;
      const seen = new Set<string>();
      ws();
      if (text[i] === "}") return void i++;
      for (;;) {
        ws();
        const key = str();
        if (seen.has(key)) duplicates.push({ path, key });
        seen.add(key);
        ws();
        i++; // ':'
        value([...path, key]);
        ws();
        if (text[i++] === "}") return;
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (text[i] === "]") return void i++;
      for (let n = 0; ; n++) {
        value([...path, n]);
        ws();
        if (text[i++] === "]") return;
      }
    }
    if (c === '"') return void str();
    const m = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i, i + 400));
    if (m) {
      i += m[0].length;
      if (!m[1] && !m[2]) {
        const n = BigInt(m[0]);
        if (n > BigInt(Number.MAX_SAFE_INTEGER) || n < -BigInt(Number.MAX_SAFE_INTEGER)) unsafeInteger = true;
      }
      return;
    }
    i += text.startsWith("true", i) ? 4 : text.startsWith("false", i) ? 5 : 4; // null
  };
  value([]);
  return { unsafeInteger, duplicates };
}

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** serde_json refuses a lone surrogate in any string, key or value. */
function hasLoneSurrogate(v: Json): boolean {
  if (typeof v === "string") return LONE_SURROGATE.test(v);
  if (Array.isArray(v)) return v.some(hasLoneSurrogate);
  if (v && typeof v === "object") return Object.entries(v).some(([k, x]) => LONE_SURROGATE.test(k) || hasLoneSurrogate(x));
  return false;
}

// ── field readers, each mirroring one serde type ─────────────────────────────

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function obj(v: Json | undefined, what: string): Obj {
  if (!isObj(v)) throw new Malformed(`${what}: expected an object`);
  return v;
}

function fields(o: Obj, what: string, known: string[], strict: boolean): void {
  for (const k of known.filter((k) => !k.startsWith("?"))) {
    if (!(k in o)) throw new Malformed(`${what}: missing field \`${k}\``);
  }
  if (strict) {
    const allowed = new Set(known.map((k) => k.replace(/^\?/, "")));
    for (const k of Object.keys(o)) if (!allowed.has(k)) throw new Malformed(`${what}: unknown field \`${k}\``);
  }
}

function str(v: Json | undefined, what: string): string {
  if (typeof v !== "string") throw new Malformed(`${what}: expected a string`);
  return v;
}

/** `Option<String>`: absent or null is None. */
function optStr(v: Json | undefined, what: string): string | null {
  return v === undefined || v === null ? null : str(v, what);
}

/** `Option<Value>`: absent or null is None; anything else is kept verbatim. */
const optValue = (v: Json | undefined): Json | null => (v === undefined || v === null ? null : v);

const HEX = /^[0-9a-fA-F]{32}$/;

/** `uuid::Uuid`: any form `Uuid::parse_str` accepts, re-serialised hyphenated lowercase. */
function uuid(v: Json | undefined, what: string): string {
  let s = str(v, what);
  if (s.startsWith("urn:uuid:")) s = s.slice(9);
  else if (s.startsWith("{") && s.endsWith("}")) s = s.slice(1, -1);
  const hex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)
    ? s.replace(/-/g, "")
    : HEX.test(s)
      ? s
      : null;
  if (!hex) throw new Malformed(`${what}: not a UUID`);
  const h = hex.toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const RFC3339 = /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:([Zz])|([+-])(\d{2}):(\d{2}))$/;

/**
 * `chrono::DateTime<Utc>`: parsed with its offset, re-serialised in UTC with
 * `Z` and the shortest of 0, 3, 6 or 9 fractional digits that is exact.
 */
function dateTime(v: Json | undefined, what: string): string {
  const m = RFC3339.exec(str(v, what));
  if (!m) throw new Malformed(`${what}: not an RFC 3339 timestamp`);
  const [, y, mo, d, h, mi, s, frac = "", z, sign, oh, om] = m;
  // Built field by field so years below 100 are not read as 19xx, and checked
  // back so an impossible date (30 February) is refused, as chrono refuses it,
  // instead of rolling over.
  const local = new Date(0);
  local.setUTCFullYear(Number(y), Number(mo) - 1, Number(d));
  local.setUTCHours(Number(h), Number(mi), Number(s), 0);
  const valid =
    local.getUTCFullYear() === Number(y) && local.getUTCMonth() === Number(mo) - 1 && local.getUTCDate() === Number(d) &&
    local.getUTCHours() === Number(h) && local.getUTCMinutes() === Number(mi) && local.getUTCSeconds() === Number(s) &&
    (z || (Number(oh) < 24 && Number(om) < 60));
  if (!valid) throw new Malformed(`${what}: not a valid date`);
  const offset = z ? 0 : (sign === "-" ? -1 : 1) * (Number(oh) * 60 + Number(om));
  const t = new Date(local.getTime() - offset * 60_000);
  const nanos = Number(frac.slice(0, 9).padEnd(9, "0"));
  const fraction =
    nanos === 0 ? "" :
    nanos % 1_000_000 === 0 ? `.${String(nanos / 1_000_000).padStart(3, "0")}` :
    nanos % 1_000 === 0 ? `.${String(nanos / 1_000).padStart(6, "0")}` :
    `.${String(nanos).padStart(9, "0")}`;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(t.getUTCFullYear(), 4)}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}T${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}${fraction}Z`;
}

function optDateTime(v: Json | undefined, what: string): string | null {
  return v === undefined || v === null ? null : dateTime(v, what);
}

function oneOf(v: Json | undefined, what: string, allowed: readonly string[]): string {
  const s = str(v, what);
  if (!allowed.includes(s)) throw new Malformed(`${what}: unknown variant \`${s}\``);
  return s;
}

// ── the typed dossier ────────────────────────────────────────────────────────

const ROLES = [
  "manufacturer", "importer", "distributor", "authorisedRepresentative", "fulfilmentServiceProvider",
  "remanufacturer", "repurposer", "preparerForReuse", "repairer", "recycler",
] as const;
const REASONS = [
  "sale", "return", "remanufacturing", "repurposing", "preparationForReuse",
  "preparationForRepurposing", "wasteHandover", "import", "insolvencySuccession",
] as const;

export type Manifest = {
  formatVersion: string;
  passportId: string;
  issuerDid: string;
  createdAt: string;
  nodeVersion: string;
  coreVersion: string;
  rulesetVersion: string | null;
  contentHashes: Record<string, string>;
};
export type SignedLayer = { payload: Json; jws: string };
export type AuditEntry = {
  id: string;
  passportId: string;
  actor: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  metadata: Json | null;
  timestamp: string;
  requestId: string | null;
  prevHash: string | null;
  entryHash: string | null;
};
export type Operator = {
  did: string;
  name: string;
  role: string;
  euOperatorId: string | null;
  euOperatorIdScheme: string | null;
  country: string;
  registeredTradeName: string | null;
  postalAddress: string | null;
  electronicAddress: string | null;
};
export type Transfer = {
  transferId: string;
  passportId: string;
  fromOperator: Operator;
  toOperator: Operator;
  reason: string;
  fromSignature: string | null;
  nodeAcceptanceAttestation: string | null;
  initiatedAt: string;
  completedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
};
export type TransferChain = { passportId: string; originalOperator: Operator; transfers: Transfer[] };
export type Dossier = {
  manifest: Manifest;
  manifestJws: string;
  fullView: SignedLayer;
  publicView: SignedLayer;
  didDocuments: Record<string, Json>;
  auditEntries: AuditEntry[];
  transferChain: TransferChain | null;
  eolEvent: Json | null;
  checkpoint: Json | null;
  calcReceipts: Json[];
  componentGraph: Json | null;
  qualifiedSeal: Json | null;
};

function manifest(v: Json | undefined): Manifest {
  const o = obj(v, "manifest");
  fields(o, "manifest", ["formatVersion", "passportId", "issuerDid", "createdAt", "nodeVersion", "coreVersion", "?rulesetVersion", "contentHashes"], true);
  const hashes = obj(o.contentHashes, "manifest.contentHashes");
  return {
    formatVersion: str(o.formatVersion, "manifest.formatVersion"),
    passportId: str(o.passportId, "manifest.passportId"),
    issuerDid: str(o.issuerDid, "manifest.issuerDid"),
    createdAt: dateTime(o.createdAt, "manifest.createdAt"),
    nodeVersion: str(o.nodeVersion, "manifest.nodeVersion"),
    coreVersion: str(o.coreVersion, "manifest.coreVersion"),
    rulesetVersion: optStr(o.rulesetVersion, "manifest.rulesetVersion"),
    contentHashes: Object.fromEntries(Object.entries(hashes).map(([k, h]) => [k, str(h, `contentHashes.${k}`)])),
  };
}

function signedLayer(v: Json | undefined, what: string): SignedLayer {
  const o = obj(v, what);
  fields(o, what, ["payload", "jws"], true);
  return { payload: o.payload as Json, jws: str(o.jws, `${what}.jws`) };
}

function auditEntry(v: Json, n: number): AuditEntry {
  const w = `auditEntries[${n}]`;
  const o = obj(v, w);
  // previousStatus, newStatus and metadata are `Option`s without a default:
  // serde still reads a missing one as None, so they are optional to read.
  fields(o, w, ["id", "passportId", "actor", "action", "?previousStatus", "?newStatus", "?metadata", "timestamp", "?requestId", "?prevHash", "?entryHash"], true);
  return {
    id: uuid(o.id, `${w}.id`),
    passportId: str(o.passportId, `${w}.passportId`),
    actor: str(o.actor, `${w}.actor`),
    action: str(o.action, `${w}.action`),
    previousStatus: optStr(o.previousStatus, `${w}.previousStatus`),
    newStatus: optStr(o.newStatus, `${w}.newStatus`),
    metadata: optValue(o.metadata),
    timestamp: dateTime(o.timestamp, `${w}.timestamp`),
    requestId: optStr(o.requestId, `${w}.requestId`),
    prevHash: optStr(o.prevHash, `${w}.prevHash`),
    entryHash: optStr(o.entryHash, `${w}.entryHash`),
  };
}

function operator(v: Json | undefined, w: string): Operator {
  const o = obj(v, w);
  fields(o, w, ["did", "name", "role", "?euOperatorId", "country"], false);
  return {
    did: str(o.did, `${w}.did`),
    name: str(o.name, `${w}.name`),
    role: oneOf(o.role, `${w}.role`, ROLES),
    euOperatorId: optStr(o.euOperatorId, `${w}.euOperatorId`),
    euOperatorIdScheme: optStr(o.euOperatorIdScheme, `${w}.euOperatorIdScheme`),
    country: str(o.country, `${w}.country`),
    registeredTradeName: optStr(o.registeredTradeName, `${w}.registeredTradeName`),
    postalAddress: optStr(o.postalAddress, `${w}.postalAddress`),
    electronicAddress: optStr(o.electronicAddress, `${w}.electronicAddress`),
  };
}

function transfer(v: Json, n: number): Transfer {
  const w = `transferChain.transfers[${n}]`;
  const o = obj(v, w);
  fields(o, w, ["transferId", "passportId", "fromOperator", "toOperator", "reason", "initiatedAt"], false);
  // `toSignature` is the serde alias the attestation was once stored under.
  if ("toSignature" in o && "nodeAcceptanceAttestation" in o) {
    throw new Malformed(`${w}: duplicate field \`nodeAcceptanceAttestation\``);
  }
  return {
    transferId: uuid(o.transferId, `${w}.transferId`),
    passportId: uuid(o.passportId, `${w}.passportId`),
    fromOperator: operator(o.fromOperator, `${w}.fromOperator`),
    toOperator: operator(o.toOperator, `${w}.toOperator`),
    reason: oneOf(o.reason, `${w}.reason`, REASONS),
    fromSignature: optStr(o.fromSignature, `${w}.fromSignature`),
    nodeAcceptanceAttestation: optStr(o.nodeAcceptanceAttestation ?? o.toSignature, `${w}.nodeAcceptanceAttestation`),
    initiatedAt: dateTime(o.initiatedAt, `${w}.initiatedAt`),
    completedAt: optDateTime(o.completedAt, `${w}.completedAt`),
    rejectedAt: optDateTime(o.rejectedAt, `${w}.rejectedAt`),
    cancelledAt: optDateTime(o.cancelledAt, `${w}.cancelledAt`),
    notes: optStr(o.notes, `${w}.notes`),
  };
}

function transferChain(v: Json | undefined): TransferChain | null {
  if (v === undefined || v === null) return null;
  const o = obj(v, "transferChain");
  fields(o, "transferChain", ["passportId", "originalOperator", "transfers"], false);
  if (!Array.isArray(o.transfers)) throw new Malformed("transferChain.transfers: expected an array");
  return {
    passportId: uuid(o.passportId, "transferChain.passportId"),
    originalOperator: operator(o.originalOperator, "transferChain.originalOperator"),
    transfers: o.transfers.map(transfer),
  };
}

/** Struct paths where a repeated key is a serde error rather than last-wins. */
const TYPED_PATH = [
  /^$/, /^manifest$/, /^(fullView|publicView)$/, /^auditEntries\.\d+$/, /^transferChain$/,
  /^transferChain\.originalOperator$/, /^transferChain\.transfers\.\d+(\.(fromOperator|toOperator))?$/,
];

/** Parse raw text into the typed dossier, or throw Malformed / Unsupported. */
export function parseDossier(text: string): { raw: Json; dossier: Dossier } {
  let raw: Json;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Malformed("not valid JSON");
  }
  if (hasLoneSurrogate(raw)) throw new Malformed("a string contains an unpaired surrogate");
  const { unsafeInteger, duplicates } = scan(text);
  const typedDup = duplicates.find((d) => TYPED_PATH.some((re) => re.test(d.path.join("."))));
  if (typedDup) throw new Malformed(`duplicate field \`${typedDup.key}\``);
  if (unsafeInteger) {
    throw new Unsupported("the file contains an integer larger than a browser can hold exactly, so its canonical form cannot be reproduced here");
  }

  const o = obj(raw, "dossier");
  fields(o, "dossier", ["manifest", "manifestJws", "fullView", "publicView", "didDocuments", "auditEntries", "?transferChain", "?eolEvent", "?checkpoint", "?calcReceipts", "?componentGraph", "?qualifiedSeal"], true);
  if (!Array.isArray(o.auditEntries)) throw new Malformed("auditEntries: expected an array");
  if ("calcReceipts" in o && !Array.isArray(o.calcReceipts)) throw new Malformed("calcReceipts: expected an array");

  return {
    raw,
    dossier: {
      manifest: manifest(o.manifest),
      manifestJws: str(o.manifestJws, "manifestJws"),
      fullView: signedLayer(o.fullView, "fullView"),
      publicView: signedLayer(o.publicView, "publicView"),
      didDocuments: obj(o.didDocuments, "didDocuments"),
      auditEntries: o.auditEntries.map(auditEntry),
      transferChain: transferChain(o.transferChain),
      eolEvent: optValue(o.eolEvent),
      checkpoint: optValue(o.checkpoint),
      calcReceipts: (o.calcReceipts as Json[] | undefined) ?? [],
      componentGraph: optValue(o.componentGraph),
      qualifiedSeal: optValue(o.qualifiedSeal),
    },
  };
}

// ── re-serialisation: serde_json::to_value of each type ──────────────────────

const some = <T extends Json>(key: string, v: T | null): Obj => (v === null ? {} : { [key]: v });

export const manifestValue = (m: Manifest): Obj => ({
  formatVersion: m.formatVersion,
  passportId: m.passportId,
  issuerDid: m.issuerDid,
  createdAt: m.createdAt,
  nodeVersion: m.nodeVersion,
  coreVersion: m.coreVersion,
  ...some("rulesetVersion", m.rulesetVersion),
  contentHashes: m.contentHashes,
});

export const auditValue = (e: AuditEntry): Obj => ({
  id: e.id,
  passportId: e.passportId,
  actor: e.actor,
  action: e.action,
  previousStatus: e.previousStatus,
  newStatus: e.newStatus,
  metadata: e.metadata,
  timestamp: e.timestamp,
  ...some("requestId", e.requestId),
  ...some("prevHash", e.prevHash),
  ...some("entryHash", e.entryHash),
});

const operatorValue = (p: Operator): Obj => ({
  did: p.did,
  name: p.name,
  role: p.role,
  euOperatorId: p.euOperatorId,
  ...some("euOperatorIdScheme", p.euOperatorIdScheme),
  country: p.country,
  ...some("registeredTradeName", p.registeredTradeName),
  ...some("postalAddress", p.postalAddress),
  ...some("electronicAddress", p.electronicAddress),
});

export const operatorJson = operatorValue;

const transferValue = (t: Transfer): Obj => ({
  transferId: t.transferId,
  passportId: t.passportId,
  fromOperator: operatorValue(t.fromOperator),
  toOperator: operatorValue(t.toOperator),
  reason: t.reason,
  fromSignature: t.fromSignature,
  nodeAcceptanceAttestation: t.nodeAcceptanceAttestation,
  initiatedAt: t.initiatedAt,
  completedAt: t.completedAt,
  ...some("rejectedAt", t.rejectedAt),
  ...some("cancelledAt", t.cancelledAt),
  notes: t.notes,
});

export const chainValue = (c: TransferChain): Obj => ({
  passportId: c.passportId,
  originalOperator: operatorValue(c.originalOperator),
  transfers: c.transfers.map(transferValue),
});

export const dossierValue = (d: Dossier): Obj => ({
  manifest: manifestValue(d.manifest),
  manifestJws: d.manifestJws,
  fullView: { payload: d.fullView.payload, jws: d.fullView.jws },
  publicView: { payload: d.publicView.payload, jws: d.publicView.jws },
  didDocuments: d.didDocuments,
  auditEntries: d.auditEntries.map(auditValue),
  ...some("transferChain", d.transferChain && chainValue(d.transferChain)),
  ...some("eolEvent", d.eolEvent),
  ...some("checkpoint", d.checkpoint),
  ...(d.calcReceipts.length ? { calcReceipts: d.calcReceipts } : {}),
  ...some("componentGraph", d.componentGraph),
  ...some("qualifiedSeal", d.qualifiedSeal),
});
