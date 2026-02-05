import assert from "node:assert/strict";
import { validateToolOutput } from "../tools/runtime/validate_output";
import type { PostconditionResult } from "../tools/runtime/postconditions";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

const res = (labels: string[]): PostconditionResult => ({
  satisfied: new Set(labels),
});

test("required postconditions deny when postRes missing", () => {
  const decision = validateToolOutput({
    requiredPostconditions: ["audit_logged", "result_sanitized"],
    successReasonCode: "TOOL_ALLOW_SEARCH",
  });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_POSTCONDITION_FAILED");
});

test("deny when missing one label", () => {
  const decision = validateToolOutput({
    requiredPostconditions: ["audit_logged", "result_sanitized"],
    postRes: res(["audit_logged"]),
    successReasonCode: "TOOL_ALLOW_SEARCH",
  });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason_code, "TOOL_POSTCONDITION_FAILED");
});

test("allow when all satisfied", () => {
  const decision = validateToolOutput({
    requiredPostconditions: ["audit_logged", "result_sanitized"],
    postRes: res(["audit_logged", "result_sanitized"]),
    successReasonCode: "TOOL_ALLOW_SEARCH",
  });
  assert.strictEqual(decision.allowed, true);
  assert.strictEqual(decision.reason_code, "TOOL_ALLOW_SEARCH");
});

test("no required postconditions always allow", () => {
  const decision = validateToolOutput({
    successReasonCode: "TOOL_ALLOW_NO_POST",
  });
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
