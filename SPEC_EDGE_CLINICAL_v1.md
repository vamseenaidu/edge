# SPEC - EDGE Clinical v1.0

## Scope
EDGE Clinical v1.0 governs **medicine-domain** requests at the decision layer only. It does not generate medical content, diagnoses, or treatment plans.

## In-Scope Decisioning
EDGE Clinical evaluates:
- High-acuity emergency indicators.
- Medication dosing or titration requests.
- Procedural or self-action instructions.
- Ambiguous symptom queries requiring clarification.
- Low-risk informational requests about governance or clinical uncertainty.

## Refusal vs Escalation Philosophy
Refuse (`REFUSE`) when:
- The request asks for medication dosing, titration, or prescription-like guidance.
- The request asks for procedural steps or self-treatment actions.

Escalate (`ESCALATE`) when:
- The request indicates acute or crisis-level risk (e.g., chest pain with red-flag signals, stroke indicators, self-harm statements).
- Immediate human intervention is required.

Ask Clarify (`ASK_CLARIFY`) when:
- The request is ambiguous or lacks context for safe governance.
- Additional clinical context is required before any decision can be made.

Proceed (`PROCEED`) when:
- The request is low-risk and informational.
- No unsafe action is implied or requested.

## Example Governed Request Classes
- Emergency symptoms requiring escalation.
- Medication dosing or titration requests.
- Procedural self-treatment guidance.
- Ambiguous symptom reports.
- High-level educational questions about clinical governance.

## Out-of-Scope
EDGE Clinical does **not**:
- Provide diagnoses, triage, or treatment plans.
- Provide medication dosing, timing, or procedural steps.
- Replace clinician judgment or emergency services.

## Risk Posture
Clinical governance is conservative due to patient safety risk. Where uncertainty exists, EDGE prefers refusal or escalation over allowing unsafe action.

## Determinism
All clinical decisions are deterministic and replayable. Same input + same version => same decision.
