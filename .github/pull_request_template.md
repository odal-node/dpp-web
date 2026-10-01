## Summary

<!-- What does this PR do? One paragraph. -->

## Changes

<!-- Bullet list of the main changes. -->

## Checklist

CI runs these on the pull request; run them locally first, since a push to
`staging` alone runs no CI. Links, spacing and llms.txt read the build, so build first.

- [ ] `pnpm -r build` and `pnpm -r check`
- [ ] `pnpm run check:links`, `check:spacing`, `check:leakage` and `check:llms`
- [ ] `pnpm run test:scripts` and `pnpm --filter dpp-landing run test:verify`
- [ ] If vendored data changed: `pnpm run check:openapi` and `pnpm --filter dpp-landing run check:core` (need the sibling repositories; see the README)
- [ ] No secrets, credentials, or `.env` files in the diff
