import assert from "node:assert/strict";
import { validateToolOutput } from "../tools/runtime/validate_output";
import type { PostconditionResult } from "../tools/runtime/postconditions";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

const ruleWithPost = {
  decision: "allow",
  reason_code: "TOOL_ALLOW_SEARCH",
  postconditions: ["audit_logged", "result_sanitized"],
};

const ruleNoPost = {
  decision: "allow",
  reason_code: "TOOL_ALLOW_NO_POST",
};

const res = (labels: string[]): PostconditionResult => ({
  satisfied: new Set(labels),
});

test("denies when postRes missing", () => {
  const decision = validateToolOutput(ruleWithPost, undefined);
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_POSTCONDITION_FAILED");
});

test("denies when missing one label", () => {
  const decision = validateToolOutput(ruleWithPost, res(["audit_logged"]));
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_POSTCONDITION_FAILED");
});

test("allows when all satisfied", () => {
  const decision = validateToolOutput(ruleWithPost, res(["audit_logged", "result_sanitized"]));
  assert.strictEqual(decision.allowed, true);
  assert.strictEqual(decision.reason_code, "TOOL_ALLOW_SEARCH");
});

test("rule without postconditions always allows", () => {
  const decision = validateToolOutput(ruleNoPost, res(["audit_logged"]));
  assert.strictEqual(decision.allowed, true);
  assert.strictEqual(decision.reason_code, "TOOL_ALLOW_NO_POST");
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
    console.log(`✓ All ${tests.length} tool postcondition tests passed.`);
  }
})();
