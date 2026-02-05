# EDGE — Deterministic AI Governance Engine
Pre-generation decision governor that deterministically outputs PROCEED / ASK_CLARIFY / REFUSE / ESCALATE and emits audit artifacts.

## What you get
- Determinism guarantees (same normalized input + policy version => same decision).
- Audit artifacts with attribution (actor / role / tenant) and traceability.
- Replayability for historical decisions and audits.
- Release gates via golden determinism regression suite.
- Identity / tenancy / RBAC plane (auth-enabled only).
- Async jobs plane for evaluation runs.
- Tool governance plane (default deny; no execution).
- Operator Workbench UI (static export, on-prem hostable).

## Quick demo (3 commands)
```bash
pnpm install
EDGE_PORT=3001 pnpm exec ts-node --transpile-only --project tsconfig.json edge/api/index.ts
NEXT_PUBLIC_EDGE_API_BASE=http://localhost:3001 pnpm -C apps/web dev
```
Open:
- http://localhost:3000/runs
- http://localhost:3000/policies

For a static export build instead of dev:
```bash
pnpm -C apps/web run dist
```

## API surface (minimal)
| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health/live` | Liveness check |
| `GET /api/v1/health/ready` | Readiness check |
| `POST /api/v1/jobs` | Submit async eval job |
| `GET /api/v1/jobs/:id` | Fetch job status/result |
| `GET /api/v1/jobs/:id/replay` | Deterministic replay envelope |
| `GET /api/v1/policies` | List policy versions |
| `GET /api/v1/policies/:version` | Fetch a policy |
| `POST /api/v1/policies/draft` | Submit draft (admin) |
| `POST /api/v1/policies/:version/publish` | Publish draft (admin) |
| `GET /api/v1/policies/active/:domain` | Read active policy |

## Determinism contract
- Same normalized input and same policy version must yield the same decision.
- Fingerprinted artifacts exclude timestamps, random IDs, and request-local noise.
- Any nondeterministic fields must be stripped before comparison.
- Golden regression snapshots enforce these invariants across releases.

## Run the determinism suite
```bash
pnpm exec ts-node --transpile-only --project tsconfig.json edge/api/__tests__/determinism_regression.test.ts
```

## On-prem posture
- No mandatory SaaS or telemetry.
- Workbench UI is a static export and can be hosted separately.
- Deployment details: `docs/onprem_deploy.md`
- Configuration matrix: `docs/config_matrix.md`

## Releases
| Tag | Meaning |
|---|---|
| `edge-2.1` | Identity + tenancy + RBAC + audit attribution |
| `edge-2.2` | Async jobs API + deterministic worker lifecycle |
| `edge-2.3` | Tool governance schema + enforcement hooks (default deny) |
| `edge-2.4` | Operator Workbench UI (static export) |
| `edge-2.5` | Determinism hardening + security baseline + ops docs |
| `edge-2.6` | Policy registry lifecycle + Workbench backend wiring |
