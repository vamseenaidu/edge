import assert from "node:assert/strict";
import { enforceToolRequest } from "../tools/runtime/enforce";
import { parseToolPolicy } from "../tools/policy/parser";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

const basePolicy = {
  version: "toolpolicy.v1",
  default: "deny",
  tools: {
    "web.search": {
      decision: "allow",
      reason_code: "TOOL_ALLOW_SEARCH",
    },
    "fs.read": {
      decision: "deny",
      reason_code: "TOOL_DENY_FS_READ",
    },
  },
};

test("null policy denies with default", () => {
  const decision = enforceToolRequest(null, { name: "web.search", input: {} });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_DENY_DEFAULT");
  assert.strictEqual(decision.rule_decision, "deny");
});

test("explicit deny returns rule reason", () => {
  const policy = parseToolPolicy(basePolicy);
  const decision = enforceToolRequest(policy, { name: "fs.read", input: {} });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_DENY_FS_READ");
  assert.strictEqual(decision.rule_decision, "deny");
});

test("allow returns allowed true", () => {
  const policy = parseToolPolicy(basePolicy);
  const decision = enforceToolRequest(policy, { name: "web.search", input: {} });
  assert.strictEqual(decision.allowed, true);
  assert.strictEqual(decision.reason_code, "TOOL_ALLOW_SEARCH");
  assert.strictEqual(decision.rule_decision, "allow");
});

test("unknown tool denies default", () => {
  const policy = parseToolPolicy(basePolicy);
  const decision = enforceToolRequest(policy, { name: "unknown.tool", input: {} });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_DENY_DEFAULT");
  assert.strictEqual(decision.rule_decision, "deny");
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
    console.log(`✓ All ${tests.length} tool enforcement tests passed.`);
  }
})();
