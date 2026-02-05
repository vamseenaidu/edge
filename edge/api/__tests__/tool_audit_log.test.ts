import assert from "node:assert/strict";
import { interceptToolRequestWithAudit } from "../tools/runtime/interceptor";
import { parseToolPolicy } from "../tools/policy/parser";
import type { PreconditionContext } from "../tools/runtime/preconditions";
import type { PostconditionResult } from "../tools/runtime/postconditions";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

const ctx = (labels: string[]): PreconditionContext => ({
  satisfied: new Set(labels),
});

const post = (labels: string[]): PostconditionResult => ({
  satisfied: new Set(labels),
});

test("missing policy denies default and audits", () => {
  const result = interceptToolRequestWithAudit({
    policy: null,
    request: { name: "web.search", input: {} },
  });

  assert.strictEqual(result.decision.allowed, false);
  assert.strictEqual(result.decision.reason_code, "TOOL_DENY_DEFAULT");
  assert.strictEqual(result.audit.allowed, false);
  assert.strictEqual(result.audit.reason_code, "TOOL_DENY_DEFAULT");
  assert.strictEqual(result.audit.rule_decision, "deny");
});

test("unmet preconditions deny and audit shows preconditions_met=false", () => {
  const policy = parseToolPolicy({
    version: "toolpolicy.v1",
    default: "deny",
    tools: {
      "web.search": {
        decision: "allow",
        reason_code: "TOOL_ALLOW_SEARCH",
        preconditions: ["network_allowed"],
      },
    },
  });

  const result = interceptToolRequestWithAudit({
    policy,
    request: { name: "web.search", input: {} },
    ctx: ctx([]),
  });

  assert.strictEqual(result.decision.allowed, false);
  assert.strictEqual(result.decision.reason_code, "TOOL_PRECONDITION_MISSING");
  assert.strictEqual(result.audit.preconditions_met, false);
  assert.deepStrictEqual(result.audit.required_preconditions, ["network_allowed"]);
});

test("postconditions unmet deny with audit postconditions_met=false", () => {
  const policy = parseToolPolicy({
    version: "toolpolicy.v1",
    default: "deny",
    tools: {
      "web.search": {
        decision: "allow",
        reason_code: "TOOL_ALLOW_SEARCH",
        preconditions: ["network_allowed"],
        postconditions: ["audit_logged", "result_sanitized"],
      },
    },
  });

  const result = interceptToolRequestWithAudit({
    policy,
    request: { name: "web.search", input: {} },
    ctx: ctx(["network_allowed"]),
    postRes: post(["audit_logged"]),
  });

  assert.strictEqual(result.decision.allowed, false);
  assert.strictEqual(result.decision.reason_code, "TOOL_POSTCONDITION_FAILED");
  assert.strictEqual(result.audit.postconditions_met, false);
  assert.deepStrictEqual(result.audit.required_postconditions, ["audit_logged", "result_sanitized"]);
});

let failures = 0;
(async () => {
  for (const { name, run } of tests) {
    try {
      await run();
    } catch (error) {
      failures += 1;
      // eslint-disable-next-line no-console
      console.error(`✖ ${name}`);
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  if (failures > 0) {
    // eslint-disable-next-line no-console
    console.error(`\n${failures} test(s) failed.`);
    process.exitCode = 1;
  } else {
    // eslint-disable-next-line no-console
    console.log(`✓ All ${tests.length} tool audit log tests passed.`);
  }
})();
