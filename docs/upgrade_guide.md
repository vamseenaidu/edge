# Upgrade Guide

## Upgrade by Tag
```bash
git fetch --tags
# Choose a release tag, e.g. edge-2.5
git checkout edge-2.5
pnpm install
```

## Determinism Verification
After upgrade, run the determinism regression suite:
```bash
pnpm exec ts-node --transpile-only --project tsconfig.json \
  edge/api/__tests__/determinism_regression.test.ts
```

## Backward Compatibility
- API envelopes are expected to remain stable across minor releases.
- Additive fields should be optional; removing fields is treated as a breaking change.
