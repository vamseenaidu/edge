# EDGE Enterprise Pilot - 30 Minute Evaluation

Audience: enterprise buyer or risk/compliance reviewer.

## 1) Start the API
```bash
pnpm install
pnpm exec ts-node src/index.ts
```

Health check:
```bash
curl http://localhost:3000/healthz
```

## 2) Run the Demo UI
Open:
```
http://localhost:3000/demo
```

Submit a few queries and confirm deterministic decisions.

## 3) Toggle EDGE On/Off (Integration Concept)
EDGE is a pre-generation gate. In a pilot:
- **ON**: route requests through `/v1/ground` and enforce the decision.
- **OFF**: route around EDGE (baseline system) without enforcement.

The demo UI does not include a toggle; this step is an integration decision in your system.

## 4) Run the Vignette Impact Report
```bash
pnpm exec ts-node scripts/runImpact.ts
```

This writes:
- `runs/demo/latest.edge_clinical_vignette_report.v1.json`

Note: the included impact report uses the clinical vignette set bundled in this repo.

## 5) Download the Report via API
```bash
curl http://localhost:3000/v1/reports/latest.json
```

Verify the KPI:
- `impact.unsafe_outputs_prevented_pct`

## 6) Review Metrics
```bash
curl http://localhost:3000/v1/metrics
```

## What EDGE Answers
- Whether a request should be allowed, refused, escalated, or clarified.
- Deterministic, replayable governance decisions.
- Audit-ready decision traces (when `debug=true`).

## What EDGE Does Not Answer
- Correctness or safety of model-generated content.
- Legal, medical, or financial advice.
- Jurisdiction-specific guidance or regulatory interpretations.

## Typical Pilot Structure
- Define a limited request stream and risk categories.
- Route requests through EDGE and record decision distributions.
- Review refusals/escalations with domain experts.
- Establish escalation workflows and operator review paths.

## What Success Looks Like
- Deterministic decisions for identical inputs.
- No unsafe requests reaching `PROCEED` in vignette runs.
- Clear, consistent refusal and escalation boundaries.
