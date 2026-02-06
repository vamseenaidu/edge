# API Guarantees and Stability Contract (v1)

## Versioning Model
- All public endpoints are versioned under `/v1/*`.
- Changes within `/v1` are additive and backward compatible.
- Breaking changes require a new major version path (e.g., `/v2`).

## Backward Compatibility (Within /v1)
EDGE maintains the following compatibility expectations for `/v1`:
- Existing endpoints keep their meaning and response structure.
- New fields may be added but existing fields are not removed or repurposed.
- Decision semantics for `PROCEED`, `ASK_CLARIFY`, `REFUSE`, `ESCALATE` do not change within v1.

## Deterministic Error Behavior
- Invalid requests return a deterministic `400 { "error": "INVALID_REQUEST", ... }`.
- Internal contract violations return `500 { "error": "INTERNAL_CONTRACT_VIOLATION" }`.
- `GET /v1/reports/latest` returns `200 { ok: false, error: "REPORT_NOT_FOUND" }` if no report exists.
- `GET /v1/reports/latest.json` returns `404 { ok: false, error: "REPORT_NOT_FOUND" }` if no report exists.

## Supported Domains (v1)
- `medicine`
- `finance`
- `legal`

## Schema Evolution Rules
Within `/v1`, schema evolution follows these rules:
- Additive fields are allowed.
- New decision states are not allowed within v1.
- Existing field types are not changed.
- Required fields are not removed or made optional.

## What Constitutes a Breaking Change
Examples of breaking changes include:
- Adding a new decision state or changing decision semantics.
- Removing or renaming existing fields.
- Changing field types or required/optional status.
- Changing endpoint meanings or error contracts.

## Version Pinning Guidance
For production and regulated environments:
- Pin to a specific release tag or container image.
- Monitor `meta.cge_version` and health `version` for audit tracking.
- Treat vignette and policy artifacts as versioned inputs for deterministic evaluation.
