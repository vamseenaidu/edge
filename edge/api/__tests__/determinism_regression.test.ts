import assert from "node:assert/strict";
import { createServer } from "../server";
import { mountJobRoutes } from "../v1/routes_jobs";
import { processAll } from "../runtime/jobs/processor";
import { interceptToolRequestWithAudit } from "../tools/runtime/interceptor";
import {
  diffStrings,
  loadGoldenFixture,
  sanitizeForGolden,
  saveGoldenFixture,
  stableStringify,
} from "./_golden";

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

async function invoke(handler: (req: any, res: any) => void, req: any) {
  const { res, done } = createMockResponse();
  handler(req, res);
  await done;
  const body = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
  return { statusCode: res.statusCode, body, headers: res.headers };
}

function buildJobHandlers() {
  const handlers: { post?: (req: any, res: any) => void; get?: (req: any, res: any) => void } = {};
  const router = {
    post: (path: string, handler: (req: any, res: any) => void) => {
      if (path === "/jobs") handlers.post = handler;
    },
    get: (path: string, handler: (req: any, res: any) => void) => {
      if (path === "/jobs/:id") handlers.get = handler;
    },
  };
  mountJobRoutes(router as any);
  if (!handlers.post || !handlers.get) {
    throw new Error("Job routes not registered as expected.");
  }
  return handlers as { post: (req: any, res: any) => void; get: (req: any, res: any) => void };
}

test("determinism regression golden snapshot", async () => {
  const originalAuth = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "0";

  try {
    const app = createServer();
    const health = await invoke(app as any, {
      method: "GET",
      url: "/api/v1/health/live",
      headers: {},
    });
    assert.strictEqual(health.statusCode, 200);

    const jobHandlers = buildJobHandlers();
    const jobCreate = await invoke(jobHandlers.post, {
      method: "POST",
      url: "/api/v1/jobs",
      headers: { "content-type": "application/json" },
      body: { kind: "eval_run", payload: { x: 1 } },
      edge_tenant_id: null,
      edge_actor: null,
    });
    assert.strictEqual(jobCreate.statusCode, 200);
    const jobId = jobCreate.body?.data?.job_id;
    assert.ok(jobId, "job_id missing from create response");

    processAll();

    const jobGet = await invoke(jobHandlers.get, {
      method: "GET",
      url: `/api/v1/jobs/${jobId}`,
      headers: {},
      params: { id: jobId },
    });
    assert.strictEqual(jobGet.statusCode, 200);

    const toolAudit = interceptToolRequestWithAudit({
      policy: null,
      request: { name: "tool.sample", input: { x: 1 } },
    });

    const snapshot = {
      health: health.body,
      jobs: {
        create: jobCreate.body,
        fetch: jobGet.body,
      },
      tool: toolAudit,
    };

    const sanitized = sanitizeForGolden(snapshot);
    const actual = stableStringify(sanitized);
    const expected = loadGoldenFixture();

    if (!expected) {
      saveGoldenFixture(sanitized);
      throw new Error(
        "Golden fixture was missing. A new fixture has been written; re-run the test to validate determinism.",
      );
    }

    const expectedString = stableStringify(expected);
    if (expectedString !== actual) {
      const diff = diffStrings(expectedString, actual);
      throw new Error(`Determinism regression detected:\n${diff}`);
    }
  } finally {
    process.env.EDGE_AUTH_ENABLED = originalAuth;
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
    console.log(`✓ All ${tests.length} determinism tests passed.`);
  }
})();
