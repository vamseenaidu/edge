export type ToolRequest = {
  name: string;
  input: unknown;
};

export type ToolEnforcementDecision = {
  allowed: boolean;
  reason_code: string;
  rule_decision: "deny" | "allow" | "conditional";
};
