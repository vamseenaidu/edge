import type { ToolPolicyV1 } from "../policy/types";
import { resolveToolRule } from "../policy/resolve";
import type { ToolEnforcementDecision, ToolRequest } from "./types";
import type { PreconditionContext } from "./preconditions";
import { arePreconditionsMet } from "./preconditions";

export function enforceToolRequest(
  policy: ToolPolicyV1 | null,
  req: ToolRequest,
  ctx?: PreconditionContext,
): ToolEnforcementDecision {
  if (!policy) {
    return {
      allowed: false,
      reason_code: "TOOL_DENY_DEFAULT",
      rule_decision: "deny",
    };
  }

  const rule = resolveToolRule(policy, req.name);
  if (rule.decision === "allow" || rule.decision === "conditional") {
    if (rule.preconditions && rule.preconditions.length > 0) {
      if (!ctx || !arePreconditionsMet(rule.preconditions, ctx)) {
        return {
          allowed: false,
          reason_code: "TOOL_PRECONDITION_MISSING",
          rule_decision: rule.decision,
        };
      }
    }
  }

  const allowed = rule.decision === "allow" || rule.decision === "conditional";

  return {
    allowed,
    reason_code: rule.reason_code,
    rule_decision: rule.decision,
  };
}
