# EDGE — Epistemic Discipline & Guardrail Engine

**Deterministic inference-time governance for high-stakes AI systems.**

EDGE is a **pre-generation decision engine** that sits between a prompt and any model output and deterministically decides:

**PROCEED · ASK_CLARIFY · REFUSE · ESCALATE**

before any language is generated.

EDGE is not a model, not a wrapper, and not post-hoc safety filtering. It is a **control layer** for making AI systems *admissible* in regulated and high-risk environments.

---

## Why EDGE Exists

Modern LLMs are powerful but unsafe by default in real-world deployments:

- Hallucination under uncertainty
- Non-reproducibility
- No audit-grade decision trail
- Mixed boundaries between advice, execution, and reasoning

Enterprises don’t buy “better answers.” They buy **risk reduction, auditability, and deployment guarantees**.

---

## Core Guarantees (Non-Negotiable)

### 1) Determinism
Same normalized input + same policy version → **same decision, always**.

### 2) Pre-generation control
EDGE decides **before** any content is produced. If EDGE refuses, nothing is generated.

### 3) Audit-grade artifacts
A governed decision can emit an audit bundle containing:
- matched rule IDs
- ordered evaluation trace
- final decision state
- normalized input hash
- policy version
- optional attribution (actor / role / tenant)

### 4) Replayability
A historical decision can be reconstructed deterministically from the same inputs + policy.

---

## Domain Strategy

EDGE ships **governance schemas**, not domain content engines.

- **EDGE-Clinical** — governance-first (no dosing, no medical advice)
- **EDGE-Finance** — fiduciary risk boundaries (schemas only)
- **EDGE-Legal** — jurisdiction ambiguity + unauthorized practice prevention (schemas only)

---

## Repo Layout (infra-first)

- `edge/api/` — HTTP surface, middleware, runtime config
- `edge/core/` — decision kernel (frozen semantics)
- `edge/audit/` — audit helpers + fingerprinting primitives
- `edge/vignettes/` — frozen governance vignette suites (FGVS)
- `ops/` — docker/k8s/systemd deployment assets
- `scripts/` — determinism checks, smoke checks, release gates
- `docs/` — operator, security model, release process

---

## Status

### Release: EDGE 2.1 (tag: `edge-2.1`)
Identity & tenancy plane:
- identity surface (actor context)
- tenant propagation
- RBAC gates (auth-enabled only)
- audit attribution (actor/role/tenant)
- operator deployment profiles

---

## Quickstart (local)

```bash
pnpm install
pnpm exec ts-node --transpile-only --project tsconfig.json edge/api/index.ts
```

## Run tests (fast)

```bash
pnpm exec ts-node --transpile-only --project tsconfig.json edge/api/__tests__/auth_middleware.test.ts
```

---

## Philosophy

Models generate text.

EDGE decides **whether they are allowed to speak**.
