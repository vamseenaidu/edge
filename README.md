# EDGE (Epistemic Discipline Governance Engine) — Deterministic AI Governance Infrastructure
**A deterministic pre-generation control plane for high-risk AI systems.**
EDGE deterministically governs AI behavior *before* output is produced, enforcing policy, safety, and accountability at inference time — not post‑hoc.

## One‑Sentence Definition (What This Is)
EDGE (Epistemic Discipline Governance Engine) is a deterministic governance engine that sits in front of AI systems and decides—before any generation or tool execution—whether the action is allowed, blocked, escalated, or requires clarification.

This is not a demo. This is **infrastructure**.

---

## Why EDGE Exists (The Problem YC Cares About)

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

EDGE never executes tools, generates content, or performs domain reasoning.  
It **decides whether an AI system is allowed to proceed at all**.

---

## Core Architectural Mandate

> **Same normalized input + same policy version → same decision, forever.**

This invariant is enforced across:
- Identity context (actor, role, tenant)
- Policy lifecycle (draft → publish → active)
- Async evaluation jobs
- Tool governance checks
- Release upgrades

Violations fail builds.

---

## Decision Semantics (Non‑Negotiable)

Every governed request resolves to **exactly one** of:

- `PROCEED` — Safe to continue
- `ASK_CLARIFY` — Missing required context
- `REFUSE` — Disallowed action
- `ESCALATE` — Human or higher‑authority review required

No confidence scores.  
No probabilistic hedging.  
No narrative justifications.

These four outcomes form a closed, enumerable decision space required for audit, insurance, and legal defensibility.

---


## Why This Is Technically Hard

EDGE solves problems most AI systems explicitly avoid:

- Deterministic evaluation over probabilistic model outputs
- Replayable decisions across async job execution
- Policy versioning without state drift
- Tool governance without tool execution
- Audit artifacts that survive legal discovery
- CI-enforced determinism (golden regression tests)

Most AI systems cannot prove the same decision twice.
EDGE fails the build if it cannot.

## Why This Is a Platform (Not a Feature)
- Determinism must span policy, identity, tooling, and async execution
- Single‑point enforcement replaces dozens of fragile checks
- Governance logic outlives any single model vendor
- Enables regulated deployment of otherwise unusable AI systems

## Governance Planes (Composable, Enforced)

### 1. **Policy Plane**
- Versioned, immutable policy artifacts
- Draft → validate → publish lifecycle
- Domain‑scoped active policy resolution
- Deterministic diffing and replay

### 2. **Decision Plane**
- Pre‑generation gating
- Zero side‑effects
- Pure function evaluation
- Fingerprintable outputs

### 3. **Audit Plane**
- Structured, replayable artifacts
- Actor / role / tenant attribution
- Tool pre‑ and post‑condition traces
- Determinism‑safe serialization

### 4. **Tool Governance Plane**
- Default‑deny execution model
- Preconditions + postconditions
- No tool execution inside EDGE
- Enforcement hooks only

### 5. **Async Evaluation Plane**
- Deterministic job queue
- Replayable results
- Golden regression enforcement
- No background nondeterminism

### 6. **Operator Plane**
- On‑prem, static Workbench UI
- Read‑only audit and policy inspection
- Draft + publish flows with RBAC
- No production write paths from UI

---

## Determinism Guarantees (Hard)

EDGE ships with a **golden regression suite**.

- Snapshots capture canonical outputs
- Any nondeterministic field is stripped
- Releases that drift fail CI
- Determinism is a build artifact, not a promise

Run locally:
```bash
pnpm exec ts-node --transpile-only --project tsconfig.json \
  edge/api/__tests__/determinism_regression.test.ts
```

## Run Locally (60 Seconds)

```bash
pnpm install
pnpm exec ts-node edge/api/index.ts
```

Verify readiness:

```bash
curl http://localhost:3000/api/v1/health/ready
```

Verify determinism:

```bash
pnpm exec ts-node edge/api/__tests__/determinism_regression.test.ts
```

---

## Minimal Runtime Surface

EDGE exposes only what must be governed.

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health/live` | Liveness |
| `GET /api/v1/health/ready` | Readiness |
| `POST /api/v1/jobs` | Async evaluation |
| `GET /api/v1/jobs/:id` | Job result |
| `GET /api/v1/jobs/:id/replay` | Deterministic replay |
| `GET /api/v1/policies` | List policies |
| `GET /api/v1/policies/:version` | Fetch policy |
| `POST /api/v1/policies/draft` | Draft (admin) |
| `POST /api/v1/policies/:version/publish` | Publish (admin) |
| `GET /api/v1/policies/active/:domain` | Resolve active policy |

No hidden endpoints.  
No dynamic mutation paths.

---

## Operator Workbench (On‑Prem)

- Static export (Next.js)
- Zero backend coupling
- Air‑gapped deployable
- Audit‑first UX

The UI is intentionally non‑authoritative. It cannot mutate production state. All writes are gated by policy, role, and server‑side enforcement.

Build:
```bash
pnpm -C apps/web build
pnpm -C apps/web run dist
```

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

Deployment docs:
- `docs/onprem_deploy.md`
- `docs/config_matrix.md`
- `docs/upgrade_guide.md`

---

## Who Uses EDGE

EDGE is infrastructure for teams who cannot afford AI failure:

- Medical AI platforms
- Financial decision engines
- Defense & intelligence systems
- Enterprise copilots with liability
- Safety‑critical automation

If “oops” is unacceptable, EDGE is required.

---

## Release Lineage

| Tag | Capability |
|---|---|
| `edge-2.1` | Identity, tenancy, RBAC, audit attribution |
| `edge-2.2` | Async jobs + deterministic workers |
| `edge-2.3` | Tool governance (default deny) |
| `edge-2.4` | Operator Workbench UI |
| `edge-2.5` | Determinism hardening + security baseline |
| `edge-2.6` | Policy registry + real backend wiring |

---

## Mandate

EDGE exists to make AI systems certifiable.

If an AI system cannot prove what it would do, given the same input and policy, it cannot be trusted in regulated or high‑liability environments.

EDGE enforces that proof—by construction.
