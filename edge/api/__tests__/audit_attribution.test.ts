import assert from "node:assert/strict";
import { createServer } from "../server";
import { attachAttributionMetadata, getAttribution } from "../runtime/attribution";

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

test("auth disabled yields null actor/role/tenant attribution", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "0";

  try {
    const app = createServer();
    const req: any = {
      method: "GET",
      url: "/api/v1/health/live",
      headers: {},
      body: undefined,
    };
    const { res, done } = createMockResponse();
    (app as any)(req, res);
    await done;

    const attribution = getAttribution(req);
    assert.strictEqual(attribution.actor_id, null);
    assert.strictEqual(attribution.role, null);
    assert.strictEqual(attribution.tenant_id, null);
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

test("auth enabled includes actor/role/tenant attribution", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "1";

  try {
    const app = createServer();
    const req: any = {
      method: "GET",
      url: "/api/v1/health/live",
      headers: {
        "x-edge-role": "auditor",
        "x-edge-actor-id": "actor-1",
        "x-edge-actor-type": "human",
        "x-edge-auth-provider": "oidc",
        "x-edge-tenant-id": "tenant-9",
      },
      body: undefined,
    };
    const { res, done } = createMockResponse();
    (app as any)(req, res);
    await done;

    const body = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(body.kind, "edge.ok");

    const audit = { metadata: attachAttributionMetadata({}, req) };
    assert.deepStrictEqual(audit.metadata.attribution, {
      actor_id: "actor-1",
      actor_type: "human",
      auth_provider: "oidc",
      role: "auditor",
      tenant_id: "tenant-9",
    });
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
    console.log(`✓ All ${tests.length} audit attribution tests passed.`);
  }
})();
