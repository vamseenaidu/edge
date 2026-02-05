import assert from "node:assert/strict";
import { stopServer } from "../runtime/serverLifecycle";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

test("stopServer closes server gracefully", async () => {
  const logs: string[] = [];
  const server: any = {
    close(callback: (err?: Error) => void) {
      callback();
    },
  };

  await stopServer(server, {
    timeoutMs: 100,
    logger: (msg) => logs.push(msg),
  });

  assert.ok(logs.includes("EDGE_SHUTDOWN_START"));
  assert.ok(logs.includes("EDGE_SHUTDOWN_COMPLETE"));
});

test("stopServer emits timeout when server does not close", async () => {
  const logs: string[] = [];
  const server: any = {
    close(_callback: (err?: Error) => void) {
      // intentionally never calls callback
    },
  };

  await stopServer(server, {
    timeoutMs: 10,
    logger: (msg) => logs.push(msg),
  });

  assert.ok(logs.includes("EDGE_SHUTDOWN_START"));
  assert.ok(logs.includes("EDGE_SHUTDOWN_TIMEOUT"));
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
    console.log(`✓ All ${tests.length} graceful shutdown tests passed.`);
  }
})();
