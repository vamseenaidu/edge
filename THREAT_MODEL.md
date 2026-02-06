# Threat Model - Governance Focus

## What EDGE Protects Against
- Ungoverned model execution by enforcing a deterministic decision gate.
- Policy drift and inconsistent outcomes across runs.
- Silent regressions by enabling deterministic replay and tests.
- Untracked decision changes via audit artifacts (when `debug=true`).

## What EDGE Does Not Protect Against
- Unsafe or incorrect content produced by downstream models.
- Adversarial prompt attacks on models (EDGE does not generate content).
- Data leakage from systems outside EDGE.
- Bypasses that route around the governance layer.

## Failure Modes
- False positives: safe requests incorrectly refused or escalated.
- False negatives: unsafe requests incorrectly allowed.
- Incomplete policy coverage for new or rare scenarios.
- Ambiguous inputs that should have been clarified.
- Misconfigured domain routing or version drift.

## Operator Misuse Risks
- Bypassing EDGE in production paths.
- Treating `PROCEED` as content approval rather than a governance decision.
- Enabling debug audit in production without review of logging posture.
- Failing to pin versions or to run deterministic regression checks.

## Why Determinism Matters
- Enables reproducible governance decisions for audit and review.
- Prevents silent policy drift across releases.
- Supports consistent enforcement of refusal and escalation boundaries.
