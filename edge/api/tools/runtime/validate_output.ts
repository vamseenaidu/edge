import type { PostconditionResult } from "./postconditions";
import { arePostconditionsMet } from "./postconditions";

export type ValidateToolOutputArgs = {
  requiredPostconditions?: string[];
  postRes?: PostconditionResult;
  successReasonCode: string;
};

export type ToolOutputValidation = {
  allowed: boolean;
  reason_code: string;
};

export function validateToolOutput(args: ValidateToolOutputArgs): ToolOutputValidation {
  const required = args.requiredPostconditions;
  if (required && required.length > 0) {
    if (!args.postRes || !arePostconditionsMet(required, args.postRes)) {
      return { allowed: false, reason_code: "TOOL_POSTCONDITION_FAILED" };
    }
  }

  return { allowed: true, reason_code: args.successReasonCode };
}
