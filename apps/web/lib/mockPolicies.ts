export type PolicySummary = {
  version: string;
  published_at?: string;
  summary: string;
};

export type PolicyRecord = PolicySummary & {
  text: string;
};

const policies: PolicyRecord[] = [
  {
    version: "v1.0",
    published_at: "2026-01-30",
    summary: "Baseline governance rules for medicine domain.",
    text: `version: policy.v1
scope:
  domain: medicine
rules:
  - id: ESCALATE_CHEST_SWEAT
    decision: ESCALATE
    reason_code: ESCALATE_CHEST_SWEAT
  - id: REFUSE_DOSING
    decision: REFUSE
    reason_code: REFUSE_DOSING
`,
  },
  {
    version: "v1.1",
    published_at: "2026-02-02",
    summary: "Adds clarify follow-up and expands escalation indicators.",
    text: `version: policy.v1
scope:
  domain: medicine
rules:
  - id: ESCALATE_CHEST_SWEAT
    decision: ESCALATE
    reason_code: ESCALATE_CHEST_SWEAT
  - id: ESCALATE_INDICATOR
    decision: ESCALATE
    reason_code: ESCALATE_INDICATOR
  - id: CLARIFY_FOLLOWUP
    decision: ASK_CLARIFY
    reason_code: CLARIFY_FOLLOWUP
  - id: REFUSE_DOSING
    decision: REFUSE
    reason_code: REFUSE_DOSING
`,
  },
  {
    version: "v1.2",
    published_at: "2026-02-05",
    summary: "Refines clarify rule and adds family history escalation.",
    text: `version: policy.v1
scope:
  domain: medicine
rules:
  - id: ESCALATE_CHEST_SWEAT
    decision: ESCALATE
    reason_code: ESCALATE_CHEST_SWEAT
  - id: ESCALATE_FAMILY
    decision: ESCALATE
    reason_code: ESCALATE_FAMILY
  - id: ESCALATE_INDICATOR
    decision: ESCALATE
    reason_code: ESCALATE_INDICATOR
  - id: CLARIFY_FOLLOWUP
    decision: ASK_CLARIFY
    reason_code: CLARIFY_FOLLOWUP
    prompt: "Clarify symptom timing and severity"
  - id: REFUSE_DOSING
    decision: REFUSE
    reason_code: REFUSE_DOSING
`,
  },
];

export function listPolicies(): PolicySummary[] {
  return policies.map(({ text, ...rest }) => rest);
}

export function getPolicy(version: string): PolicyRecord | null {
  return policies.find((policy) => policy.version === version) ?? null;
}
