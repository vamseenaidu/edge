import type { ToolPolicyV1, ToolRuleV1 } from "../policy/types";
import type { ToolEnforcementDecision, ToolRequest } from "./types";
import type { PreconditionContext } from "./preconditions";
import type { PostconditionResult } from "./postconditions";
import { enforceToolRequest } from "./enforce";
import { validateToolOutput } from "./validate_output";
import { resolveToolRule } from "../policy/resolve";
import { arePreconditionsMet } from "./preconditions";
import { arePostconditionsMet } from "./postconditions";
import type { ToolAuditAttribution, ToolAuditEvent } from "./audit";
import { buildToolAuditEvent } from "./audit";

export function interceptToolRequest(args: {
  policy: ToolPolicyV1 | null;
  request: ToolRequest;
  ctx?: PreconditionContext;
}): ToolEnforcementDecision {
  return enforceToolRequest(args.policy, args.request, args.ctx);
}

export function interceptToolRequestWithAudit(args: {
  policy: ToolPolicyV1 | null;
  request: ToolRequest;
  ctx?: PreconditionContext;
  postRes?: PostconditionResult;
  attribution?: ToolAuditAttribution;
}): { decision: ToolEnforcementDecision; audit: ToolAuditEvent } {
  const decision = enforceToolRequest(args.policy, args.request, args.ctx);

  const rule: ToolRuleV1 | null = args.policy ? resolveToolRule(args.policy, args.request.name) : null;
  const requiredPreconditions = rule?.preconditions;
  const requiredPostconditions = rule?.postconditions;

  const preconditionsMet = requiredPreconditions
    ? Boolean(args.ctx && arePreconditionsMet(requiredPreconditions, args.ctx))
    : undefined;

  let postconditionsMet: boolean | undefined = undefined;
  let finalDecision = decision;

  if (decision.allowed && requiredPostconditions && requiredPostconditions.length > 0) {
    postconditionsMet = args.postRes ? arePostconditionsMet(requiredPostconditions, args.postRes) : false;
    const validation = validateToolOutput({
      requiredPostconditions,
      postRes: args.postRes,
      successReasonCode: decision.reason_code,
    });
    finalDecision = {
      allowed: validation.allowed,
      reason_code: validation.reason_code,
      rule_decision: decision.rule_decision,
    };
  }

  const audit = buildToolAuditEvent({
    tool_name: args.request.name,
    decision: finalDecision,
    required_preconditions: requiredPreconditions,
    preconditions_met: preconditionsMet,
    required_postconditions: requiredPostconditions,
    postconditions_met: postconditionsMet,
    attribution: args.attribution,
  });

  return { decision: finalDecision, audit };
}
