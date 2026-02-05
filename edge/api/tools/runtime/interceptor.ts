import type { ToolPolicyV1 } from "../policy/types";
import type { ToolEnforcementDecision, ToolRequest } from "./types";
import type { PreconditionContext } from "./preconditions";
import { enforceToolRequest } from "./enforce";

export function interceptToolRequest(args: {
  policy: ToolPolicyV1 | null;
  request: ToolRequest;
  ctx?: PreconditionContext;
}): ToolEnforcementDecision {
  return enforceToolRequest(args.policy, args.request, args.ctx);
}
