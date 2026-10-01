// verify.ts — the browser twin of dpp-vault's `verify_dossier_json`.
//
// Runs the node's checks in the node's order, each independently, so one
// tamper flips the check it touches and not the rest. Nothing is fetched and
// nothing is sent: every key comes from the DID documents embedded in the
// file, exactly as the node's own offline verifier trusts them.
//
// Two deliberate differences from the node, both reported, never hidden:
//
//   - `qualified_seal` is not opened. The node reads a CAdES seal with a seal
//     inspector; the browser has none, which the node itself reports as
//     "not opened" rather than failed.
//   - A file the browser cannot reproduce byte for byte (an integer beyond
//     2^53) is refused as unsupported instead of checked approximately.
//
// Golden-tested against verdicts the engine's own verifier produced on
// dossiers the engine's own types built: tests/verify.test.ts.
import { b64urlDecode, bytesEqual, contentHash, jcs, sha256Hex, utf8, type Json } from "./canonical.ts";
import {
  Malformed,
  Unsupported,
  auditValue,
  chainValue,
  dossierValue,
  manifestValue,
  parseDossier,
  operatorJson,
  type Dossier,
  type Transfer,
} from "./dossier.ts";

export type CheckName =
  | "manifest_signature"
  | "content_integrity"
  | "full_view_signature"
  | "public_view_signature"
  | "audit_chain"
  | "transfer_chain"
  | "checkpoint"
  | "calc_receipts"
  | "component_graph"
  | "qualified_seal"
  | "input_fidelity";

export type CheckStatus = { status: "pass" } | { status: "fail" | "absent"; detail: string };
export type Check = { name: CheckName } & CheckStatus;

export type Outcome =
  | { kind: "malformed"; message: string }
  | { kind: "unsupported"; message: string }
  | { kind: "report"; exit: 0 | 1; checks: Check[]; dossier: Dossier };

const pass = (): CheckStatus => ({ status: "pass" });
const fail = (detail: string): CheckStatus => ({ status: "fail", detail });
const absent = (detail: string): CheckStatus => ({ status: "absent", detail });

type Obj = { [key: string]: Json };
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

// ── JWS: dpp-crypto's verifier and key extraction ────────────────────────────

/** `jws.splitn(3, '.')`: a fourth dot stays inside the signature segment. */
function splitn3(jws: string): string[] {
  const a = jws.indexOf(".");
  if (a < 0) return [jws];
  const b = jws.indexOf(".", a + 1);
  if (b < 0) return [jws.slice(0, a), jws.slice(a + 1)];
  return [jws.slice(0, a), jws.slice(a + 1, b), jws.slice(b + 1)];
}

function header(segment: string): Obj | null {
  try {
    const h = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(b64urlDecode(segment)));
    return isObj(h) ? h : null;
  } catch {
    return null;
  }
}

/** `verify_jws`: false for a wrong shape or algorithm; throws on malformed bytes. */
async function verifyJws(jws: string, publicKeyB64: string): Promise<boolean> {
  const parts = splitn3(jws);
  if (parts.length !== 3) return false;
  // Pinned, not negotiated: anything but EdDSA (including "none") is a failure.
  if (header(parts[0])?.alg !== "EdDSA") return false;
  const sig = b64urlDecode(parts[2]);
  if (sig.length !== 64) throw new Error("Ed25519 signature must be 64 bytes");
  const raw = b64urlDecode(publicKeyB64);
  if (raw.length !== 32) throw new Error("Ed25519 public key must be 32 bytes");
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey("raw", raw as BufferSource, { name: "Ed25519" }, false, ["verify"]);
  } catch {
    throw new Error("invalid key");
  }
  return crypto.subtle.verify({ name: "Ed25519" }, key, sig as BufferSource, utf8(`${parts[0]}.${parts[1]}`));
}

/** `verify_jws_content`: the signature holds AND covers exactly these canonical bytes. */
async function verifyJwsContent(jws: string, key: string, expected: Json): Promise<boolean> {
  if (!(await verifyJws(jws, key))) return false;
  const segment = jws.split(".")[1];
  if (segment === undefined) throw new Error("JWS has no payload segment");
  return bytesEqual(b64urlDecode(segment), utf8(jcs(expected)));
}

function assertionIds(doc: Obj): string[] {
  const am = doc.assertionMethod;
  return Array.isArray(am) ? am.filter((x): x is string => typeof x === "string") : [];
}

function ed25519X(jwk: Json | undefined): string | null {
  if (!isObj(jwk) || jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || typeof jwk.x !== "string") return null;
  return jwk.x;
}

/** Assertion-authorised verification methods, in document order. */
function authorisedKeys(doc: Json): string[] {
  if (!isObj(doc) || !Array.isArray(doc.verificationMethod)) return [];
  const ids = assertionIds(doc);
  return doc.verificationMethod.flatMap((vm) => {
    if (!isObj(vm) || typeof vm.id !== "string" || !ids.includes(vm.id)) return [];
    const x = ed25519X(vm.publicKeyJwk);
    return x ? [x] : [];
  });
}

/**
 * `resolve_public_key`: a `kid` must resolve by SHA-256 fingerprint (which
 * reaches rotated-out keys still listed); only a JWS with no `kid` at all falls
 * back to the primary key. A `kid` that resolves to nothing is `null`, never a
 * silent substitution.
 */
async function resolvePublicKey(jws: string, doc: Json): Promise<string | null> {
  const kid = header(jws.split(".")[0])?.kid;
  const keys = authorisedKeys(doc);
  if (typeof kid !== "string") return keys[0] ?? null;
  for (const x of keys) {
    try {
      if ((await sha256Hex(b64urlDecode(x))) === kid) return x;
    } catch {
      /* an undecodable key is skipped, as the Rust `?` skips it */
    }
  }
  return null;
}

async function signatureCheck(jws: string, key: string | null, issuer: string, payload: Json, wrong: string): Promise<CheckStatus> {
  if (!key) return fail(`no DID document available for issuer ${issuer}`);
  try {
    return (await verifyJwsContent(jws, key, payload)) ? pass() : fail(wrong);
  } catch (e) {
    return fail(`malformed signature: ${(e as Error).message}`);
  }
}

// ── the chains ───────────────────────────────────────────────────────────────

async function auditChain(d: Dossier): Promise<CheckStatus> {
  let expected = "";
  for (const [index, e] of d.auditEntries.entries()) {
    const stored = e.prevHash ?? "";
    if (stored !== expected) {
      return fail(`broken at entry ${index}: prev_hash link broken: stored ${JSON.stringify(stored)}, expected ${JSON.stringify(expected)}`);
    }
    const recomputed = await contentHash({
      id: e.id,
      passportId: e.passportId,
      actor: e.actor,
      action: e.action,
      previousStatus: e.previousStatus,
      newStatus: e.newStatus,
      metadata: e.metadata,
      timestamp: e.timestamp,
      prevHash: expected,
    });
    if ((e.entryHash ?? "") !== recomputed) return fail(`broken at entry ${index}: entry_hash mismatch — content tampered`);
    expected = recomputed;
  }
  return pass();
}

const signingPayload = (t: Transfer): Json => ({
  transferId: t.transferId,
  passportId: t.passportId,
  fromOperator: operatorJson(t.fromOperator),
  toOperator: operatorJson(t.toOperator),
  reason: t.reason,
  initiatedAt: t.initiatedAt,
});

const acceptancePayload = (t: Transfer): Json => ({ attests: "acceptance", ...(signingPayload(t) as Obj) });

async function transferSignature(did: string, jws: string, payload: Json, docs: Obj): Promise<string | null> {
  const doc = docs[did];
  if (doc === undefined) return `no DID document available for ${did} — cannot verify`;
  const key = await resolvePublicKey(jws, doc);
  if (!key) return `no usable assertion key found in DID document for ${did}`;
  try {
    return (await verifyJwsContent(jws, key, payload))
      ? null
      : `signature does not verify against ${did}'s key, or covers different content than the transfer terms`;
  } catch (e) {
    return `malformed signature: ${(e as Error).message}`;
  }
}

async function transferChain(d: Dossier): Promise<CheckStatus> {
  if (!d.transferChain) return absent("no transfer chain on this passport");
  for (const [index, t] of d.transferChain.transfers.entries()) {
    const completed = t.completedAt !== null && t.rejectedAt === null && t.cancelledAt === null;
    if (t.fromSignature !== null) {
      const issue = await transferSignature(t.fromOperator.did, t.fromSignature, signingPayload(t), d.didDocuments);
      if (issue) return fail(`broken at transfer ${index}: From(${JSON.stringify(issue)})`);
    } else if (completed) {
      return fail(`broken at transfer ${index}: From("completed transfer is missing the from-operator signature")`);
    }
    // The acceptance is the hosting node's attestation, so it is checked
    // against the dossier's issuer, never against the receiving operator.
    if (t.nodeAcceptanceAttestation !== null) {
      const issue = await transferSignature(d.manifest.issuerDid, t.nodeAcceptanceAttestation, acceptancePayload(t), d.didDocuments);
      if (issue) return fail(`broken at transfer ${index}: Acceptance(${JSON.stringify(issue)})`);
    } else if (completed) {
      return fail(`broken at transfer ${index}: Acceptance("completed transfer is missing the node's acceptance attestation")`);
    }
  }
  return pass();
}

// ── members that carry their own report ──────────────────────────────────────

function componentGraph(report: Json | null): CheckStatus {
  if (report === null) return absent("no component graph on this passport");
  const nodes = isObj(report) && Array.isArray(report.nodes) ? report.nodes : [];
  const unverified = nodes.filter((n) => isObj(n) && n.verified === false) as Obj[];
  if (!unverified.length) return pass();
  const bad = unverified.find((n) => typeof n.reason === "string" && ["hashMismatch", "cycle", "malformedRef"].includes(n.reason));
  if (bad) return fail(`component tree integrity violation at ${bad.path === undefined ? "unknown" : JSON.stringify(bad.path)}`);
  return absent(`${unverified.length} component(s) could not be verified at snapshot time (unreachable or beyond walk bounds)`);
}

async function contentHashes(d: Dossier): Promise<Record<string, string>> {
  const out: Record<string, string> = {
    fullView: await contentHash(d.fullView.payload),
    publicView: await contentHash(d.publicView.payload),
    auditEntries: await contentHash(d.auditEntries.map(auditValue)),
  };
  if (d.transferChain) out.transferChain = await contentHash(chainValue(d.transferChain));
  if (d.eolEvent !== null) out.eolEvent = await contentHash(d.eolEvent);
  if (d.componentGraph !== null) out.componentGraph = await contentHash(d.componentGraph);
  if (d.qualifiedSeal !== null) out.qualifiedSeal = await contentHash(d.qualifiedSeal);
  return out;
}

async function contentIntegrity(d: Dossier): Promise<CheckStatus> {
  let recomputed: Record<string, string>;
  try {
    recomputed = await contentHashes(d);
  } catch (e) {
    return fail(`cannot canonicalise dossier members: ${(e as Error).message}`);
  }
  const committed = d.manifest.contentHashes;
  const keys = new Set([...Object.keys(recomputed), ...Object.keys(committed)]);
  if ([...keys].every((k) => recomputed[k] === committed[k])) return pass();
  const mismatched = Object.keys(recomputed).sort().filter((k) => recomputed[k] !== committed[k]);
  return fail(`content hash mismatch for: ${mismatched.join(", ")}`);
}

// ── the entry point ──────────────────────────────────────────────────────────

/** Verify a dossier's raw text. Never throws; every outcome is a value. */
export async function verifyDossierText(text: string): Promise<Outcome> {
  let parsed: ReturnType<typeof parseDossier>;
  try {
    parsed = parseDossier(text);
  } catch (e) {
    if (e instanceof Unsupported) return { kind: "unsupported", message: e.message };
    if (e instanceof Malformed) return { kind: "malformed", message: e.message };
    return { kind: "malformed", message: (e as Error).message };
  }
  const { raw, dossier: d } = parsed;
  const issuer = d.manifest.issuerDid;
  const issuerDoc = d.didDocuments[issuer];
  const issuerKey = issuerDoc === undefined ? null : await resolvePublicKey(d.manifestJws, issuerDoc);

  const checks: Check[] = [
    {
      name: "manifest_signature",
      ...(await signatureCheck(d.manifestJws, issuerKey, issuer, manifestValue(d.manifest),
        "manifest signature invalid, or covers different content than this manifest")),
    },
    { name: "content_integrity", ...(await contentIntegrity(d)) },
    {
      name: "full_view_signature",
      ...(await signatureCheck(d.fullView.jws, issuerKey, issuer, d.fullView.payload,
        "signature invalid, or covers different content than this payload")),
    },
    {
      name: "public_view_signature",
      ...(await signatureCheck(d.publicView.jws, issuerKey, issuer, d.publicView.payload,
        "signature invalid, or covers different content than this payload")),
    },
    { name: "audit_chain", ...(await auditChain(d)) },
    { name: "transfer_chain", ...(await transferChain(d)) },
    {
      name: "checkpoint",
      ...(d.checkpoint === null
        ? absent("checkpoint layer not yet implemented — audit chain integrity is checked, but nothing pins the chain head against third-party re-hash")
        : fail("checkpoint present but this verifier build does not yet check it")),
    },
    {
      name: "calc_receipts",
      ...(d.calcReceipts.length === 0
        ? absent("no calculation receipts — dpp-calc invocation is not yet wired (licensed factor data pending)")
        : fail("calc receipts present but this verifier build does not yet check them")),
    },
    { name: "component_graph", ...componentGraph(d.componentGraph) },
    {
      name: "qualified_seal",
      ...(d.qualifiedSeal === null
        ? absent("this passport carries no qualified seal")
        : absent("no seal reader was supplied, so the seal was not opened")),
    },
    {
      name: "input_fidelity",
      ...(jcs(raw) === jcs(dossierValue(d))
        ? pass()
        : fail("dossier content changed after parsing — a field was likely dropped silently (e.g. an unknown field nested inside a tolerant type such as a transfer record)")),
    },
  ];

  return { kind: "report", exit: checks.some((c) => c.status === "fail") ? 1 : 0, checks, dossier: d };
}
