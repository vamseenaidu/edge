import assert from "node:assert/strict";
import { enforceToolRequest } from "../tools/runtime/enforce";
import { parseToolPolicy } from "../tools/policy/parser";
import type { PreconditionContext } from "../tools/runtime/preconditions";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

const policy = parseToolPolicy({
  version: "toolpolicy.v1",
  default: "deny",
  tools: {
    "web.search": {
      decision: "allow",
      reason_code: "TOOL_ALLOW_SEARCH",
      preconditions: ["network_allowed", "audit_enabled"],
    },
    "fs.read": {
      decision: "deny",
      reason_code: "TOOL_DENY_FS",
      preconditions: ["filesystem_allowed"],
    },
  },
});

const ctx = (labels: string[]): PreconditionContext => ({
  satisfied: new Set(labels),
});

test("allow rule denies when ctx missing", () => {
  const decision = enforceToolRequest(policy, { name: "web.search", input: {} });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_PRECONDITION_MISSING");
});

test("allow rule denies when missing one precondition", () => {
  const decision = enforceToolRequest(policy, { name: "web.search", input: {} }, ctx(["network_allowed"]));
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_PRECONDITION_MISSING");
});

test("allow rule allows when all preconditions satisfied", () => {
  const decision = enforceToolRequest(
    policy,
    { name: "web.search", input: {} },
    ctx(["network_allowed", "audit_enabled"]),
  );
  assert.strictEqual(decision.allowed, true);
  assert.strictEqual(decision.reason_code, "TOOL_ALLOW_SEARCH");
});

test("deny rule remains deny regardless of ctx", () => {
  const decision = enforceToolRequest(policy, { name: "fs.read", input: {} }, ctx(["filesystem_allowed"]));
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_DENY_FS");
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
    console.log(`✓ All ${tests.length} tool precondition tests passed.`);
  }
})();
