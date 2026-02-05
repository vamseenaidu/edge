import type { PolicyRecord } from "./types";

const policies: PolicyRecord[] = [
  {
    version: "edge-clinical.v1.0.0",
    summary: "Baseline clinical governance rules.",
    text: `version: edge-clinical.v1
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
    version: "edge-clinical.v1.0.1",
    summary: "Adds clarify follow-up rule.",
    text: `version: edge-clinical.v1
scope:
  domain: medicine
rules:
  - id: ESCALATE_CHEST_SWEAT
    decision: ESCALATE
    reason_code: ESCALATE_CHEST_SWEAT
  - id: CLARIFY_FOLLOWUP
    decision: ASK_CLARIFY
    reason_code: CLARIFY_FOLLOWUP
  - id: REFUSE_DOSING
    decision: REFUSE
    reason_code: REFUSE_DOSING
`,
  },
  {
    version: "edge-clinical.v1.1.0",
    summary: "Adds family history escalation rule.",
    text: `version: edge-clinical.v1
scope:
  domain: medicine
rules:
  - id: ESCALATE_CHEST_SWEAT
    decision: ESCALATE
    reason_code: ESCALATE_CHEST_SWEAT
  - id: ESCALATE_FAMILY
    decision: ESCALATE
    reason_code: ESCALATE_FAMILY
  - id: REFUSE_DOSING
    decision: REFUSE
    reason_code: REFUSE_DOSING
`,
  },
];

export function listPolicies(): Array<{ version: string; summary: string }> {
  return policies.map((policy) => ({ version: policy.version, summary: policy.summary }));
}

export function getPolicy(version: string): PolicyRecord | null {
  return policies.find((policy) => policy.version === version) ?? null;
}
