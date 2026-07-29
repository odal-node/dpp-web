# @odal/shared-content

Regulatory-fact content shared between the two Odal Node web properties (`odal-node.io` and `docs.odal-node.io`).

This package has no runtime — it exports typed TypeScript constants. It exists because the same facts (the data-boundary guarantees, the signing pipeline) were previously authored independently on the landing page's `/trust` and in the docs' "What Odal can and cannot see" page, and had already drifted from each other. Both sites now import from here.

Each fact carries two depths where the two sites genuinely need different detail:

- `summary` — one line, for the landing page's compressed presentation.
- `detail` — the full docs-depth wording.

Marketing prose (hero copy, feature-card blurbs) is **not** part of this package and should not be — voice legitimately differs between a landing page and docs. Only facts that must stay identical across both sites (step counts, table rows, guarantees) belong here.

## Sync rule

If a fact changes (a new deployment guarantee, a corrected step), change it once here. Neither site should hand-retype these facts locally again.
