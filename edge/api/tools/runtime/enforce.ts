import type { ToolPolicyV1 } from "../policy/types";
import { resolveToolRule } from "../policy/resolve";
import type { ToolEnforcementDecision, ToolRequest } from "./types";

export function enforceToolRequest(policy: ToolPolicyV1 | null, req: ToolRequest): ToolEnforcementDecision {
  if (!policy) {
    return {
      allowed: false,
      reason_code: "TOOL_DENY_DEFAULT",
      rule_decision: "deny",
    };
  }

  const rule = resolveToolRule(policy, req.name);
  const allowed = rule.decision === "allow" || rule.decision === "conditional";

  return {
    allowed,
    reason_code: rule.reason_code,
    rule_decision: rule.decision,
  };
}
