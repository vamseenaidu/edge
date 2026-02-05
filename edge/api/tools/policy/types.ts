export type ToolDecision = "deny" | "allow" | "conditional";

export type ToolRuleV1 = {
  decision: ToolDecision;
  reason_code: string;
  preconditions?: string[];
  postconditions?: string[];
};

export type ToolPolicyV1 = {
  version: "toolpolicy.v1";
  default: "deny";
  tools: Record<string, ToolRuleV1>;
};
