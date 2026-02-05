import assert from "node:assert/strict";
import { clear, dequeue, enqueue, size } from "../runtime/jobs/queue";
import { completeJob, createJob, failJob, getJob, startJob } from "../runtime/jobs/store";
import { processNextJob } from "../runtime/jobs/processor";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

test("queue FIFO order", () => {
  clear();
  enqueue("job-1");
  enqueue("job-2");
  enqueue("job-3");

  assert.strictEqual(size(), 3);
  assert.strictEqual(dequeue(), "job-1");
  assert.strictEqual(dequeue(), "job-2");
  assert.strictEqual(dequeue(), "job-3");
  assert.strictEqual(dequeue(), null);
  assert.strictEqual(size(), 0);
});

test("processNextJob transitions queued to completed", () => {
  clear();
  const job = createJob({ kind: "eval_run" });
  enqueue(job.id);

  const processed = processNextJob();
  assert.ok(processed);
  assert.strictEqual(processed?.status, "completed");

  const stored = getJob(job.id);
  assert.ok(stored);
  assert.strictEqual(stored?.status, "completed");
});

test("fail transition works", () => {
  const job = createJob({ kind: "eval_run" });
  const running = startJob(job.id);
  assert.ok(running);

  const failed = failJob(job.id, "boom");
  assert.ok(failed);
  assert.strictEqual(failed?.status, "failed");
  assert.strictEqual(failed?.error?.message, "boom");
});

test("illegal transition is blocked deterministically", () => {
  const job = createJob({ kind: "eval_run" });
  const completed = completeJob(job.id, { accepted: true });
  assert.ok(completed);

  const started = startJob(job.id);
  assert.strictEqual(started, null);
  const stored = getJob(job.id);
  assert.strictEqual(stored?.status, "completed");
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
    console.log(`✓ All ${tests.length} jobs queue tests passed.`);
  }
})();
