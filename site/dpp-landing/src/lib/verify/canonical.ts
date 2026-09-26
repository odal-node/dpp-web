// canonical.ts — the byte-level primitives the dossier verifier rests on.
//
// Each mirrors one function in the Rust code the node runs, and must produce
// the same bytes, or a genuine dossier would fail here while passing there:
//
//   jcs()           dpp_crypto::jws::canonicalize / dpp_rules content_hash:
//                   RFC 8785. Keys sorted by UTF-16 code unit, no whitespace,
//                   numbers in ECMAScript Number#toString form. JavaScript's
//                   own JSON.stringify already emits RFC 8785 strings and
//                   numbers, which is why RFC 8785 chose them.
//   b64urlDecode()  base64::URL_SAFE_NO_PAD: no padding, and trailing bits
//                   must be zero; anything else is an error, not a guess.
//   sha256Hex()     sha2::Sha256, hex-encoded lowercase.
//
// Golden-tested against dossiers the engine itself produced; see
// tests/verify.test.ts.

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** RFC 8785 canonical JSON text. Throws on a non-finite number, as JCS does. */
export function jcs(value: Json): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("JCS cannot represent a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(jcs).join(",")}]`;
  // Default sort compares UTF-16 code units, which is exactly RFC 8785 §3.2.3.
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${jcs(value[k] as Json)}`).join(",")}}`;
}

const encoder = new TextEncoder();
export const utf8 = (text: string) => encoder.encode(text);

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const LOOKUP = new Map([...ALPHABET].map((c, i) => [c, i]));

/** Strict unpadded base64url, as the `base64` crate's URL_SAFE_NO_PAD decodes it. */
export function b64urlDecode(text: string): Uint8Array {
  if (text.length % 4 === 1) throw new Error("invalid base64url length");
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of text) {
    const v = LOOKUP.get(ch);
    if (v === undefined) throw new Error(`invalid base64url character ${JSON.stringify(ch)}`);
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  // Leftover bits must be zero padding; a non-zero remainder is a different
  // encoding of the same bytes, and the Rust decoder refuses it.
  if (bits > 0 && (buffer & ((1 << bits) - 1)) !== 0) throw new Error("invalid base64url trailing bits");
  return new Uint8Array(out);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
  return [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hex SHA-256 of a value's canonical bytes: `dpp_rules::canonical::content_hash`. */
export const contentHash = (value: Json) => sha256Hex(utf8(jcs(value)));

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
