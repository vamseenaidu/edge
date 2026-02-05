import { BadRequestError } from "../../http_errors";
import type { ToolDecision, ToolPolicyV1, ToolRuleV1 } from "./types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const parseDecision = (value: unknown): ToolDecision => {
  if (value === "deny" || value === "allow" || value === "conditional") {
    return value;
  }
  throw new BadRequestError("Invalid tool decision");
};

const parseStringArray = (value: unknown, label: string): string[] | undefined => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new BadRequestError(`Invalid ${label}`);
  }
  const normalized = value.map((item) => {
    if (!isNonEmptyString(item)) {
      throw new BadRequestError(`Invalid ${label}`);
    }
    return item.trim();
  });
  return normalized;
};

const parseToolRule = (value: unknown): ToolRuleV1 => {
  if (!isObject(value)) {
    throw new BadRequestError("Invalid tool rule");
  }

  const decision = parseDecision(value.decision);
  if (!isNonEmptyString(value.reason_code)) {
    throw new BadRequestError("Invalid tool reason_code");
  }

  return {
    decision,
    reason_code: value.reason_code.trim(),
    preconditions: parseStringArray(value.preconditions, "preconditions"),
    postconditions: parseStringArray(value.postconditions, "postconditions"),
  };
};

export function parseToolPolicy(input: unknown): ToolPolicyV1 {
  if (!isObject(input)) {
    throw new BadRequestError("Invalid tool policy");
  }

  if (input.version !== "toolpolicy.v1") {
    throw new BadRequestError("Invalid tool policy version");
  }

  if (input.default !== "deny") {
    throw new BadRequestError("Default decision must be deny");
  }

  if (!isObject(input.tools)) {
    throw new BadRequestError("Invalid tools map");
  }

  const tools: Record<string, ToolRuleV1> = {};
  for (const [key, value] of Object.entries(input.tools)) {
    if (!isNonEmptyString(key)) {
      throw new BadRequestError("Invalid tool name");
    }
    tools[key] = parseToolRule(value);
  }

  return {
    version: "toolpolicy.v1",
    default: "deny",
    tools,
  };
}
