## Summary

<!-- What does this PR do? One paragraph. -->

## Changes

<!-- Bullet list of the main changes. -->

## Checklist

CI runs these on the pull request; run them locally first, since a push to
`staging` alone runs no CI. Links, spacing, llms.txt and sitemaps read the build, so build first.

- [ ] `pnpm -r build` and `pnpm -r check`
- [ ] `pnpm run check:links`, `check:spacing`, `check:leakage`, `check:llms` and `check:sitemaps`
- [ ] `pnpm run test:scripts`, `pnpm --filter dpp-landing run test:verify` and `pnpm audit --audit-level high`
- [ ] If vendored data changed: `pnpm run check:openapi` and `pnpm --filter dpp-landing run check:core` (need the sibling repositories; see the README)
- [ ] No secrets, credentials, or `.env` files in the diff
