# CGE API

## API
- POST `/v1/ground`: Decision endpoint for governance evaluation. Body includes `query`, `domain: "medicine"`, and optional `debug` to emit audit metadata.
- GET `/v1/metrics`: Returns the in-memory metrics snapshot (counters and rates for decisions and debug usage). Metrics are in-memory only and reset on restart.
- GET `/healthz`: Deterministic liveness `{ ok: true, service: "cge-api", version: "v1.0" }`.

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
