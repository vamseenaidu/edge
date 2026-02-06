# SPEC - EDGE Legal v1.0

## Scope
EDGE Legal v1.0 governs **legal-domain** requests at the decision layer only. It does not generate legal advice, interpretations, or drafted documents.

## Out-of-Scope
EDGE Legal does **not**:
- Provide legal advice or opinions.
- Interpret laws, regulations, or case law.
- Draft, review, or revise legal documents.
- Provide jurisdiction-specific guidance.

## Refusal vs Escalation Philosophy
Legal is **default-conservative** due to high liability risk.

Refuse (`REFUSE`) when:
- The request seeks legal advice or strategy.
- The request asks to draft contracts, wills, pleadings, notices, or agreements.
- The request asks to interpret laws, regulations, or case law.
- The request is jurisdiction-specific ("Is this legal in X?").

Escalate (`ESCALATE`) when:
- The request implies legal risk, disputes, or exposure.
- There is active litigation or criminal implication.
- There is regulatory enforcement or investigation context.

Ask Clarify (`ASK_CLARIFY`) when:
- The request mentions legal process without explicit intent.
- The situation involves a third party and the user's role is unclear.

Proceed (`PROCEED`) when:
- The request is high-level and educational (e.g., what lawyers do, what courts are).

## Example Governed Request Classes
- "Can you draft a contract for me?" (REFUSE)
- "Is it legal to do X in my state?" (REFUSE)
- "My company received a legal notice - what should we do?" (ESCALATE)
- "What does legal advice mean?" (PROCEED)

## Risk Posture
Legal governance is intentionally conservative. When legal advice or jurisdiction-specific guidance is implied, EDGE refuses or escalates.

## Determinism
All legal decisions are deterministic and replayable. Same input + same version => same decision.
