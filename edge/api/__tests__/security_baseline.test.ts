import assert from "node:assert/strict";
import { createServer } from "../server";
import { assertAuthConfigSafe } from "../runtime/security_guards";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

type MockResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  finished: boolean;
  headersSent: boolean;
  on: (event: string, handler: () => void) => MockResponse;
  setHeader: (name: string, value: string) => void;
  getHeader: (name: string) => string | undefined;
  set: (name: string, value: string) => MockResponse;
  status: (code: number) => MockResponse;
  send: (payload: any) => MockResponse;
  json: (payload: any) => MockResponse;
  end: (payload?: any) => void;
};

function createMockResponse(): { res: MockResponse; done: Promise<void> } {
  let resolveDone: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  const listeners: Record<string, Array<() => void>> = {};

  const emit = (event: string) => {
    for (const handler of listeners[event] ?? []) {
      handler();
    }
  };

  const res = {} as MockResponse;
  res.statusCode = 200;
  res.headers = {};
  res.body = undefined;
  res.finished = false;
  res.headersSent = false;
  res.on = (event: string, handler: () => void) => {
    (listeners[event] ??= []).push(handler);
    return res;
  };
  res.setHeader = (name: string, value: string) => {
    res.headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name: string) => res.headers[name.toLowerCase()];
  res.set = (name: string, value: string) => {
    res.setHeader(name, value);
    return res;
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.send = (payload: any) => {
    res.body = payload;
    res.end();
    return res;
  };
  res.json = (payload: any) => {
    res.body = payload;
    res.end();
    return res;
  };
  res.end = (payload?: any) => {
    if (payload !== undefined) {
      res.body = payload;
    }
    if (res.finished) return;
    res.finished = true;
    res.headersSent = true;
    emit("finish");
    resolveDone();
  };

  return { res, done };
}

async function invoke(app: any, req: any) {
  const { res, done } = createMockResponse();
  app(req, res);
  await done;
  const body = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
  return { statusCode: res.statusCode, body, headers: res.headers };
}

test("security headers are present on API responses", async () => {
  const app = createServer();
  const response = await invoke(app as any, {
    method: "GET",
    url: "/api/v1/health/live",
    headers: {},
  });
  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.headers["x-content-type-options"], "nosniff");
  assert.strictEqual(response.headers["x-frame-options"], "DENY");
});

test("auth misconfig guard throws when auth enabled without mode", () => {
  const env = {
    EDGE_AUTH_ENABLED: "1",
  };
  assert.throws(() => assertAuthConfigSafe(env), (err: any) => {
    return err instanceof Error && err.message.startsWith("EDGE_AUTH_MISCONFIG:");
  });
});

test("auth misconfig guard allows explicit override", () => {
  const env = {
    EDGE_AUTH_ENABLED: "1",
    EDGE_ALLOW_INSECURE_AUTH: "1",
  };
  assert.doesNotThrow(() => assertAuthConfigSafe(env));
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
    console.log(`✓ All ${tests.length} security baseline tests passed.`);
  }
})();
