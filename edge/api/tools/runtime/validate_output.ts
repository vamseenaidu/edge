import type { ToolRuleV1 } from "../policy/types";
import type { ToolEnforcementDecision } from "./types";
import type { PostconditionResult } from "./postconditions";
import { arePostconditionsMet } from "./postconditions";

export function validateToolOutput(
  rule: ToolRuleV1,
  postRes?: PostconditionResult,
): ToolEnforcementDecision {
  if (rule.postconditions && rule.postconditions.length > 0) {
    if (!postRes || !arePostconditionsMet(rule.postconditions, postRes)) {
      return {
        allowed: false,
        reason_code: "TOOL_POSTCONDITION_FAILED",
        rule_decision: rule.decision,
      };
    }
  }

  return {
    allowed: true,
    reason_code: rule.reason_code,
    rule_decision: rule.decision,
  };
}
