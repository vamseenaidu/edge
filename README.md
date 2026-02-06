# EDGE API — Deterministic AI Governance Engine
**A deterministic inference-time control layer for high-risk AI systems.**
EDGE makes governance decisions *before* any model output is produced, enforcing policy, safety, and accountability at inference time — not post‑hoc.

## Definition
EDGE (Epistemic Discipline Governance Engine) is a deterministic governance engine that sits in front of AI systems and decides—before any generation or tool execution—whether the action may proceed, must be clarified, must be refused, or must be escalated.

EDGE is governance infrastructure: it **does not generate domain content** and it **does not execute tools**.

---

## Why EDGE Exists

 - AI safety today is probabilistic and non‑replayable
 - Enterprises cannot certify or insure AI behavior
 - Policy enforcement is post‑hoc and non‑binding
 - Release upgrades silently change behavior
 - Audits cannot be executed or re‑verified

EDGE exists to turn AI governance from narrative assurance into executable infrastructure.

---


## 30-Second Mental Model

EDGE sits *in front of* an LLM, agent runtime, or tool executor.

**Request → EDGE → {PROCEED | ASK_CLARIFY | REFUSE | ESCALATE} → Model / Agent / Tool Runtime**

EDGE:
- never generates content
- never executes tools
- never guesses

Supported domains in this repo (v1.0):
- `medicine` (EDGE-Clinical)
- `finance` (EDGE-Finance; decision-only)
- `legal` (EDGE-Legal; decision-only, conservative)

It deterministically decides whether AI is allowed to act.

## What EDGE Is (And Is Not)

**EDGE is:**
- A **deterministic inference‑time governor**
- A **policy‑versioned decision engine**
- A **compliance‑grade audit artifact generator**
- A **control plane for regulated AI domains**

**EDGE is not:**
- A chatbot
- A wrapper UI
- A post‑hoc log analyzer
- A policy suggestion engine

EDGE never executes tools or generates domain content.  
It **decides whether an AI system is allowed to proceed at all**.

---

## Core Architectural Mandate

> **Same input + same domain + same EDGE version → same decision.**

This repo enforces determinism via:
- Contract-bound request/response schemas (fail-closed)
- A domain router (medicine / finance / legal)
- Schema-driven, ordered rule evaluation per domain
- Golden regression tests (decision tables + vignettes)

---

## Decision Semantics (Non‑Negotiable)

Every governed request resolves to **exactly one** of:

- `PROCEED` — Safe to continue
- `ASK_CLARIFY` — Missing required context
- `REFUSE` — Disallowed action
- `ESCALATE` — Human or higher‑authority review required

No confidence scores.
No probabilistic hedging.

These four outcomes form a closed, enumerable decision space required for audit, insurance, and legal defensibility.

---

## Why This Is Technically Hard

- Deterministic evaluation over probabilistic model behavior (no “sometimes”)
- Domain isolation via schema + routing (no cross-domain leakage)
- Fail-closed contract enforcement (invalid outputs cannot be emitted)
- Audit artifacts that are replayable and safe to store (hash + preview)
- Golden regression enforcement (decision tables + vignette sets)

## Why This Is a Platform (Not a Feature)
- Determinism must span policy, identity, tooling, and async execution
- Single‑point enforcement replaces dozens of fragile checks
- Governance logic outlives any single model vendor
- Enables regulated deployment of otherwise unusable AI systems

---

## Determinism Guarantees (Hard)

EDGE ships with deterministic decision tables and smoke tests.

- Same input + same domain + same version → same decision
- Contract validation is fail-closed
- Regression is enforced via golden decision tables

Run locally:
```bash
pnpm install
pnpm test:decision
pnpm test:legal
pnpm test:vignettes
pnpm test:metrics
pnpm test:impact
pnpm test:demo
pnpm test:demo:landing
```

## Run Locally

```bash
pnpm install
pnpm dev
```

Health check:
```bash
curl -s http://localhost:3000/healthz | jq
```

Decision endpoint:
```bash
curl -s -X POST http://localhost:3000/v1/ground \
  -H "Content-Type: application/json" \
  -d '{"query":"52M chest pain with sweating","domain":"medicine"}' | jq
```

Demo:
- Open: `http://localhost:3000/demo`

---

## Runtime Configuration

Environment variables:
- `CGE_DISABLE_LOG=1` — disables local request logging (recommended in production).
- `CGE_VERSION` — overrides the version value returned by `/healthz` (does not change decision logic).
- `PORT` — port for the HTTP server (default `3000`).
- `HOST` — bind address for the HTTP server (default `0.0.0.0`).
- `NODE_ENV` — set to `production` for production deployments.
- `CGE_DISABLE_LOG=1` is recommended unless you explicitly need local request logging.

Artifacts are local-only by default:
- `runs/requests.v1.jsonl` — request log (hash + preview only).
- `runs/demo/demo.summary.json` — guided demo run summary.
- `runs/demo/latest.edge_clinical_vignette_report.v1.json` — latest clinical vignette impact report.
- `artifacts/clinical_vignettes.v1.json` — clinical vignette fixtures.
- `artifacts/finance_vignettes.v1.json` — finance vignette fixtures.
- `artifacts/legal_vignettes.v1.json` — legal vignette fixtures.

## Docker

```bash
docker build -t cge-api .
docker run --rm -p 3000:3000 -e HOST=0.0.0.0 -e PORT=3000 cge-api
```

---

## Ops Notes

Recommended production settings:
- Set `CGE_DISABLE_LOG=1` unless you explicitly need local request logging.
- Keep `HOST=0.0.0.0` and run behind a reverse proxy (TLS termination upstream).
- Pin `CGE_VERSION` to the deployed release identifier for audit trails.

Safe logging posture:
- Logs are local-only and store `query_sha256` + a short `query_preview`.
- Full request bodies are never written to disk.

---

## Minimal Runtime Surface

| Endpoint | Purpose |
|---|---|
| `GET /healthz` | Health (deterministic payload) |
| `POST /v1/ground` | Deterministic governance decision (domain-bound) |
| `GET /v1/metrics` | In-memory counters + rates |
| `GET /v1/vignettes` | Vignette fixtures (sorted) |
| `GET /v1/reports/latest` | Latest impact report metadata |
| `GET /v1/reports/latest.json` | Latest impact report JSON |
| `GET /demo` | Canonical demo landing page |

No hidden endpoints.  
No dynamic mutation paths.

---

## Deployment Philosophy

- **No SaaS dependency**
- **No forced telemetry**
- **No vendor lock‑in**
- **No black boxes**

EDGE is designed to survive:
- Regulatory audits
- Legal discovery
- Security reviews
- Insurance underwriting

---

## Who Uses EDGE

EDGE is infrastructure for teams who cannot afford AI failure:

- Medical AI platforms
- Financial decision engines
- Legal decision support and compliance systems
- Insurance underwriting and claims automation
- Defense & intelligence systems
- Critical infrastructure operations (energy, utilities, transport)
- Enterprise copilots with liability
- Government and public-sector AI systems

If “oops” is unacceptable, EDGE is required.

---

## Enterprise Trust Pack (Docs)

This repo includes a documentation-only trust pack:
- `SPEC_EDGE_CORE_v1.md`
- `SPEC_EDGE_CLINICAL_v1.md`
- `SPEC_EDGE_FINANCE_v1.md`
- `SPEC_EDGE_LEGAL_v1.md`
- `API_GUARANTEES.md`
- `SECURITY_NOTES.md`
- `THREAT_MODEL.md`
- `LICENSING.md`
- `PILOT_README.md`
- `CHANGELOG.md`

---

## Mandate

EDGE exists to make AI systems certifiable.

If an AI system cannot prove what it would do, given the same input and policy, it cannot be trusted in regulated or high‑liability environments.

EDGE enforces that proof—by construction.
