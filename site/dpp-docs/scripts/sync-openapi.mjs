// Copy the canonical OpenAPI spec from the sibling dpp-engine repo into public/.
//
// The copy at public/openapi.yaml is **vendored** (committed) so CI builds work
// without dpp-engine checked out alongside. Run this locally (or from a bot job
// that has both repos) whenever the spec changes:  pnpm run sync:openapi
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = fileURLToPath(new URL('../../../../dpp-engine/api/openapi.yaml', import.meta.url));
const dest = `${root}public/openapi.yaml`;

if (existsSync(src)) {
  copyFileSync(src, dest);
  console.log(`synced ${src} -> ${dest}`);
} else {
  console.warn(`skip: ${src} not found (dpp-engine not checked out) — using vendored ${dest}`);
}
