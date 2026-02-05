import type { ToolEnforcementDecision } from "./types";

export type ToolAuditAttribution = {
  actor_id: string | null;
  tenant_id: string | null;
  role: string | null;
};

export type ToolAuditEvent = {
  tool_name: string;
  rule_decision: "deny" | "allow" | "conditional";
  allowed: boolean;
  reason_code: string;
  required_preconditions?: string[];
  preconditions_met?: boolean;
  required_postconditions?: string[];
  postconditions_met?: boolean;
  attribution?: ToolAuditAttribution;
};

export type ToolAuditBuildArgs = {
  tool_name: string;
  decision: ToolEnforcementDecision;
  required_preconditions?: string[];
  preconditions_met?: boolean;
  required_postconditions?: string[];
  postconditions_met?: boolean;
  attribution?: ToolAuditAttribution;
};

export function buildToolAuditEvent(args: ToolAuditBuildArgs): ToolAuditEvent {
  const event: ToolAuditEvent = {
    tool_name: args.tool_name,
    rule_decision: args.decision.rule_decision,
    allowed: args.decision.allowed,
    reason_code: args.decision.reason_code,
  };

  if (args.required_preconditions && args.required_preconditions.length > 0) {
    event.required_preconditions = [...args.required_preconditions];
    if (args.preconditions_met !== undefined) {
      event.preconditions_met = args.preconditions_met;
    }
  }

  if (args.required_postconditions && args.required_postconditions.length > 0) {
    event.required_postconditions = [...args.required_postconditions];
    if (args.postconditions_met !== undefined) {
      event.postconditions_met = args.postconditions_met;
    }
  }

  if (args.attribution) {
    event.attribution = {
      actor_id: args.attribution.actor_id ?? null,
      tenant_id: args.attribution.tenant_id ?? null,
      role: args.attribution.role ?? null,
    };
  }

  return event;
}
