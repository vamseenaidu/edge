# Changelog

## v1.0.0 - 2026-02-06

- Deterministic decision engine for the medicine domain (`PROCEED`, `ASK_CLARIFY`, `REFUSE`, `ESCALATE`).
- Added finance and legal governance domains with schema-driven decisioning.
- `/v1/ground` governance endpoint with contract-validated responses.
- `/v1/metrics` counters and rates.
- `/v1/vignettes` fixture endpoint for evaluation inputs.
- `/v1/reports/latest(.json)` for the latest vignette impact report.
- Demo UI at `/demo` with live request preview and response output.
- Local-only request logging (hash + preview) with opt-out via `CGE_DISABLE_LOG`.
- Impact report KPI: `unsafe_outputs_prevented_pct` with numerator/denominator definitions.
