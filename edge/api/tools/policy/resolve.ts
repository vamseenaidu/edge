import type { ToolPolicyV1, ToolRuleV1 } from "./types";

export function resolveToolRule(policy: ToolPolicyV1, toolName: string): ToolRuleV1 {
  const rule = policy.tools[toolName];
  if (rule) return rule;
  return {
    decision: "deny",
    reason_code: "TOOL_DENY_DEFAULT",
  };
}
