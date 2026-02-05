import type { PolicyDraftInput, PolicyRecord } from "./types";

const policies: PolicyRecord[] = [
  {
    version: "edge-clinical.v1.0.0",
    domain: "medicine",
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
    status: "draft",
  },
  {
    version: "edge-clinical.v1.0.1",
    domain: "medicine",
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
    status: "draft",
  },
  {
    version: "edge-clinical.v1.1.0",
    domain: "medicine",
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
    status: "published",
  },
];

export function listPolicies(): Array<{ version: string; summary: string }> {
  return policies.map((policy) => ({ version: policy.version, summary: policy.summary }));
}

export function getPolicy(version: string): PolicyRecord | null {
  return policies.find((policy) => policy.version === version) ?? null;
}

export function submitDraft(input: PolicyDraftInput): PolicyRecord {
  const exists = policies.some((policy) => policy.version === input.version);
  if (exists) {
    throw new Error("POLICY_VERSION_EXISTS");
  }
  const record: PolicyRecord = {
    version: input.version,
    domain: input.domain,
    summary: input.summary,
    text: input.text,
    status: "draft",
  };
  policies.push(record);
  return record;
}

export function publishPolicy(version: string): PolicyRecord | null {
  const policy = policies.find((item) => item.version === version);
  if (!policy) return null;

  for (const item of policies) {
    if (item.domain === policy.domain && item.status === "published" && item.version !== policy.version) {
      item.status = "draft";
    }
  }

  policy.status = "published";
  return policy;
}

export function getActivePolicy(domain: string): PolicyRecord | null {
  return policies.find((policy) => policy.domain === domain && policy.status === "published") ?? null;
}
