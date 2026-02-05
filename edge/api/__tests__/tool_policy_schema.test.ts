import assert from "node:assert/strict";
import { parseToolPolicy } from "../tools/policy/parser";
import { resolveToolRule } from "../tools/policy/resolve";

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
      preconditions: ["network_allowed"],
    },
  },
};

test("valid policy parses", () => {
  const parsed = parseToolPolicy(basePolicy);
  assert.strictEqual(parsed.version, "toolpolicy.v1");
  assert.strictEqual(parsed.default, "deny");
  assert.strictEqual(parsed.tools["web.search"].decision, "allow");
});

test("invalid version rejects", () => {
  assert.throws(() => parseToolPolicy({ ...basePolicy, version: "toolpolicy.v2" }));
});

test("missing default rejects", () => {
  const invalid = { ...basePolicy } as any;
  delete invalid.default;
  assert.throws(() => parseToolPolicy(invalid));
});

test("unknown tool returns implicit deny", () => {
  const parsed = parseToolPolicy(basePolicy);
  const rule = resolveToolRule(parsed, "nonexistent.tool");
  assert.strictEqual(rule.decision, "deny");
  assert.strictEqual(rule.reason_code, "TOOL_DENY_DEFAULT");
});

test("default is deny enforced", () => {
  assert.throws(() => parseToolPolicy({ ...basePolicy, default: "allow" }));
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
    console.log(`✓ All ${tests.length} tool policy schema tests passed.`);
  }
})();
