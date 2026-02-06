# SPEC - EDGE Core v1.0

## Purpose
EDGE Core is a deterministic governance layer that evaluates requests **before** any model generation or tool execution. It returns a single decision that controls whether downstream systems are allowed to proceed.

## Canonical Decision States
Exactly one of:
- `PROCEED`: Safe to continue.
- `ASK_CLARIFY`: Missing required context; ask for more information.
- `REFUSE`: Disallowed action; do not proceed.
- `ESCALATE`: Requires human or higher-authority review.

These four outcomes are the complete and closed decision space.

## Decision Precedence (Evaluation Order)
1. `REFUSE`
2. `ESCALATE`
3. `ASK_CLARIFY`
4. `PROCEED` (default)

This precedence is deterministic and fixed for v1.0.

## Determinism Guarantees
- Same normalized input + same versioned rules => same decision.
- No stochastic components, external calls, or time-dependent logic.
- Outputs are contract-validated and stable across runs.

## Fail-Closed Behavior
- If internal output validation fails, the system returns `500 { "error": "INTERNAL_CONTRACT_VIOLATION" }`.
- Partial or unvalidated payloads are never returned.

## Versioning Discipline
- `/v1/*` endpoints are versioned; compatibility is managed within the v1 contract.
- Responses include `meta.cge_version` for decision outputs and `version` on health responses.
- Changes must be additive and contract-safe within v1.x.

## Explicit Non-Goals
EDGE does **not**:
- Generate content, recommendations, or advice.
- Execute tools or perform side effects.
- Interpret domain knowledge beyond its governance rules.
- Provide legal, medical, or financial guidance.

## Error Contracts (v1)
- `/v1/ground`: `500 { "error": "INTERNAL_CONTRACT_VIOLATION" }` on internal contract failure.
- `/v1/vignettes`: `500 { "ok": false, "error": "VIGNETTES_NOT_FOUND" | "VIGNETTES_UNAVAILABLE" }`.
- `/v1/reports/latest`: `200 { ok: false, error: "REPORT_NOT_FOUND" }` if no report exists.
- `/v1/reports/latest.json`: `404 { ok: false, error: "REPORT_NOT_FOUND" }` if no report exists.
