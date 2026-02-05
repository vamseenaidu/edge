export type ToolAuditEvent = {
  tool_name: string;
  rule_decision: "deny" | "allow" | "conditional";
  allowed: boolean;
  reason_code: string;
  required_preconditions?: string[];
  preconditions_met?: boolean;
  required_postconditions?: string[];
  postconditions_met?: boolean;
  attribution?: { actor_id: string | null; tenant_id: string | null; role: string | null };
};

export type RunDecision = {
  state: string;
  reason_code: string;
};

export type RunRecord = {
  id: string;
  decision: RunDecision;
  domain: string;
  policy_version: string;
  timestamp?: string;
  matched_rules: string[];
  tool_audit?: ToolAuditEvent[];
};

const runs: RunRecord[] = [
  {
    id: "run_2026_02_05_001",
    decision: { state: "ESCALATE", reason_code: "ESCALATE_CHEST_SWEAT" },
    domain: "medicine",
    policy_version: "policy.v1",
    timestamp: "2026-02-05 09:14 UTC",
    matched_rules: ["ESCALATE_CHEST_SWEAT", "ESCALATE_INDICATOR"],
    tool_audit: [
      {
        tool_name: "web.search",
        rule_decision: "conditional",
        allowed: false,
        reason_code: "TOOL_PRECONDITION_MISSING",
        required_preconditions: ["network_allowed", "audit_enabled"],
        preconditions_met: false,
        required_postconditions: ["audit_logged", "result_sanitized"],
        postconditions_met: false,
        attribution: { actor_id: "auditor-17", tenant_id: "tenant-9", role: "auditor" },
      },
    ],
  },
  {
    id: "run_2026_02_05_002",
    decision: { state: "PROCEED", reason_code: "PROCEED_BASELINE" },
    domain: "medicine",
    policy_version: "policy.v1",
    timestamp: "2026-02-05 10:02 UTC",
    matched_rules: ["PROCEED_BASELINE"],
  },
];

export function listRuns(): RunRecord[] {
  return runs;
}

export function getRun(id: string): RunRecord | null {
  return runs.find((run) => run.id === id) ?? null;
}
