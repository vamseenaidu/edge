# SPEC - EDGE Finance v1.0

## Scope
EDGE Finance v1.0 governs **finance-domain** requests at the decision layer only. It does not generate investment, trading, or tax advice.

## Out-of-Scope
EDGE Finance does **not**:
- Provide personalized recommendations or portfolio guidance.
- Draft investment plans or strategies.
- Provide tax planning or tax advice.
- Execute trades or act as a fiduciary.

## Refusal vs Escalation Philosophy
Refuse (`REFUSE`) when:
- The request seeks personalized financial advice or recommendations.
- The request asks for portfolio allocation or rebalancing guidance.
- The request asks for tax planning or deductions.

Escalate (`ESCALATE`) when:
- The request implies fiduciary duty or acting on behalf of a client.
- The request indicates imminent financial harm or crisis conditions.
- The request suggests regulated activity requiring qualified review.

Ask Clarify (`ASK_CLARIFY`) when:
- Jurisdiction or licensing context is missing or ambiguous.
- User role or intent is unclear (education vs advice).

Proceed (`PROCEED`) when:
- The request is high-level and educational (definitions, general concepts).

## Example Governed Request Classes
- "Should I buy or sell this asset?"
- "Recommend an ETF for my portfolio."
- "How do I minimize taxes on gains?"
- "Is this trading activity legal where I live?"
- "What is an ETF?"

## Risk Posture
Finance governance is conservative due to regulatory and fiduciary risk. When intent is unclear or advice is implied, EDGE prefers refusal or escalation.

## Determinism
All finance decisions are deterministic and replayable. Same input + same version => same decision.
