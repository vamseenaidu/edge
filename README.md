# CGE API

## API
- POST `/v1/ground`: Decision endpoint for governance evaluation. Body includes `query`, `domain: "medicine"`, and optional `debug` to emit audit metadata.
- GET `/v1/metrics`: Returns the in-memory metrics snapshot (counters and rates for decisions and debug usage). Metrics are in-memory only and reset on restart.
- GET `/healthz`: Deterministic liveness `{ ok: true, service: "cge-api", version: "v1.0" }`.

## E2.1 Identity & Tenancy (Operator Notes)
Environment variables:
- `EDGE_AUTH_ENABLED` (default: `false`)
- `EDGE_HOST` or `HOST`
- `EDGE_PORT` or `PORT`
- `EDGE_SHUTDOWN_TIMEOUT_MS`
- Optional config file: `EDGE_RUNTIME_CONFIG_FILE` or `EDGE_CONFIG_FILE`

Request headers (identity surface):
- `x-edge-actor-id`
- `x-edge-actor-type` (`human`|`service`)
- `x-edge-auth-provider` (`oidc`|`saml`|`none`)
- `x-edge-role` (`platform_admin`|`policy_author`|`auditor`|`operator`)
- `x-edge-tenant-id`

Behavior rules:
- When `EDGE_AUTH_ENABLED=0`: RBAC is not enforced; attribution `actor`/`role` are `null`; tenant propagates if header present, otherwise `null`.
- When `EDGE_AUTH_ENABLED=1`: RBAC gates apply to `/api/v1/metrics`, `/api/v1/contract`, `/api/v1/meta`; attribution includes actor/role/tenant as available.
- Audit attribution fields (when emitted) are under `metadata.attribution = { actor_id, actor_type, auth_provider, role, tenant_id }`.

Deployment profiles:

Local dev (auth disabled)
```bash
EDGE_AUTH_ENABLED=0
EDGE_HOST=0.0.0.0
EDGE_PORT=3000
EDGE_SHUTDOWN_TIMEOUT_MS=10000
```
```bash
curl -s http://localhost:3000/api/v1/health/live
```
```bash
# RBAC behavior check (requires EDGE_AUTH_ENABLED=1)
curl -i http://localhost:3000/api/v1/contract
curl -i http://localhost:3000/api/v1/contract -H "x-edge-role: auditor"
```

Enterprise pilot (auth enabled, header role required)
```bash
EDGE_AUTH_ENABLED=1
EDGE_HOST=0.0.0.0
EDGE_PORT=3000
EDGE_SHUTDOWN_TIMEOUT_MS=10000
```
```bash
curl -s http://localhost:3000/api/v1/health/live
```
```bash
curl -i http://localhost:3000/api/v1/contract
curl -i http://localhost:3000/api/v1/contract -H "x-edge-role: auditor"
```

Perimeter-controlled on-prem (auth enabled + tenant headers)
```bash
EDGE_AUTH_ENABLED=1
EDGE_HOST=0.0.0.0
EDGE_PORT=3000
EDGE_SHUTDOWN_TIMEOUT_MS=10000
```
```bash
curl -s http://localhost:3000/api/v1/health/live
```
```bash
curl -i http://localhost:3000/api/v1/contract -H "x-edge-tenant-id: tenant-9"
curl -i http://localhost:3000/api/v1/contract -H "x-edge-tenant-id: tenant-9" -H "x-edge-role: auditor"
```

## Demo + UI
- `pnpm demo` runs the leadership preset and writes artifacts to `runs/demo`.
- `pnpm demo:debug` includes audit data in responses.
- The summary JSON is saved at `runs/demo/demo.summary.json`.
- Run `pnpm dev` then open `http://localhost:3000/`. Paste a query (or load an example) and click **Run CGE**. Toggle **Debug (include audit)** to include the audit section in responses.

## Local
- Install deps: `pnpm install`
- Build: `pnpm build`
- Start (compiled): `pnpm start` then `curl -s http://localhost:3000/healthz`
- Dev (ts-node + nodemon): `pnpm dev`

## Docker
- Build: `docker build -t cge-api .`
- Run: `docker run --rm -p 3000:3000 cge-api`
- Verify: `curl -s http://localhost:3000/healthz`

## Fly.io
- Login: `fly auth login`
- Launch (first time): `fly launch --no-deploy --name cge-api-powstik --region iad`
- Deploy: `fly deploy`
- Status: `fly status`
- Verify (replace app URL if different):
  - `curl -s https://cge-api-powstik.fly.dev/healthz`
  - `curl -s -X POST https://cge-api-powstik.fly.dev/v1/ground -H "Content-Type: application/json" -d '{"query":"52M chest pain with sweating","domain":"medicine"}'`
  - `curl -s https://cge-api-powstik.fly.dev/`

## Examples
- No debug:
  - `curl -s -X POST http://localhost:3000/v1/ground -H "Content-Type: application/json" -d '{"query":"52M chest pain with sweating","domain":"medicine"}' | jq`
- With debug:
  - `curl -s -X POST http://localhost:3000/v1/ground -H "Content-Type: application/json" -d '{"query":"52M chest pain with sweating","domain":"medicine","debug":true}' | jq`

## Release
- CGE API v1.0 — YC-ready
- Suggested tag (not executed): `git tag -a cge-v1.0-yc -m "YC-ready deploy"`

## UI
- Run `pnpm dev` then open `http://localhost:3000/`.
- Paste a query (or load an example) and click **Run CGE**.
- Toggle **Debug (include audit)** to include the audit section in responses.
