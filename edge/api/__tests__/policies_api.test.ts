import assert from "node:assert/strict";
import { createServer } from "../server";

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
  return { statusCode: res.statusCode, body };
}

test("auth disabled allows policies list", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "0";

  try {
    const app = createServer();
    const response = await invoke(app as any, {
      method: "GET",
      url: "/api/v1/policies",
      headers: {},
    });
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body.kind, "edge.ok");
    assert.ok(Array.isArray(response.body.data.policies));
    assert.ok(response.body.data.policies.length > 0);
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

test("auth enabled rejects policies list without role", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "1";

  try {
    const app = createServer();
    const response = await invoke(app as any, {
      method: "GET",
      url: "/api/v1/policies",
      headers: {},
    });
    assert.strictEqual(response.statusCode, 403);
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

test("auth enabled allows auditor to fetch policy", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "1";

  try {
    const app = createServer();
    const response = await invoke(app as any, {
      method: "GET",
      url: "/api/v1/policies/edge-clinical.v1.0.0",
      headers: {
        "x-edge-role": "auditor",
      },
    });
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body.kind, "edge.ok");
    assert.strictEqual(response.body.data.policy.version, "edge-clinical.v1.0.0");
    assert.ok(typeof response.body.data.policy.text === "string");
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

test("unknown policy version returns 404", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "0";

  try {
    const app = createServer();
    const response = await invoke(app as any, {
      method: "GET",
      url: "/api/v1/policies/unknown",
      headers: {},
    });
    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.body.kind, "edge.error");
    assert.strictEqual(response.body.error.code, "NOT_FOUND");
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
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
    console.log(`✓ All ${tests.length} policies API tests passed.`);
  }
})();
