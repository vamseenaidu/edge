import assert from "node:assert/strict";
import { clear, enqueue } from "../runtime/jobs/queue";
import { createOrGetJob, getJob } from "../runtime/jobs/store";
import { processAll } from "../runtime/jobs/processor";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

test("idempotent createOrGetJob returns same id for same key+tenant", () => {
  const jobA = createOrGetJob({
    kind: "eval_run",
    payload: { input: "a" },
    tenant_id: "tenant-1",
    actor_id: null,
    idempotency_key: "idem-key",
  });
  const jobB = createOrGetJob({
    kind: "eval_run",
    payload: { input: "b" },
    tenant_id: "tenant-1",
    actor_id: null,
    idempotency_key: "idem-key",
  });
  assert.strictEqual(jobA.id, jobB.id);
});

test("enqueue + processAll completes job deterministically", () => {
  clear();
  const job = createOrGetJob({
    kind: "eval_run",
    payload: { input: "c" },
    tenant_id: "tenant-2",
    actor_id: null,
    idempotency_key: "idem-key-2",
  });
  enqueue(job.id);

  const results = processAll();
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0]?.id, job.id);
  assert.strictEqual(results[0]?.status, "completed");
  assert.deepStrictEqual(results[0]?.result, { accepted: true });

  const stored = getJob(job.id);
  assert.strictEqual(stored?.status, "completed");
});

test("re-running processAll does not change completed job", () => {
  clear();
  const job = createOrGetJob({
    kind: "eval_run",
    payload: { input: "d" },
    tenant_id: "tenant-3",
    actor_id: null,
    idempotency_key: "idem-key-3",
  });
  enqueue(job.id);
  processAll();

  const before = getJob(job.id);
  enqueue(job.id);
  const results = processAll();

  const after = getJob(job.id);
  assert.strictEqual(results.length, 0);
  assert.strictEqual(after?.status, "completed");
  assert.deepStrictEqual(after?.result, before?.result);
});

test("same idempotency key across tenants yields different ids", () => {
  const jobA = createOrGetJob({
    kind: "eval_run",
    payload: { input: "e" },
    tenant_id: "tenant-a",
    actor_id: null,
    idempotency_key: "shared-key",
  });
  const jobB = createOrGetJob({
    kind: "eval_run",
    payload: { input: "f" },
    tenant_id: "tenant-b",
    actor_id: null,
    idempotency_key: "shared-key",
  });
  assert.notStrictEqual(jobA.id, jobB.id);
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
    console.log(`✓ All ${tests.length} jobs worker equivalence tests passed.`);
  }
})();
