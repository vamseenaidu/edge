import assert from "node:assert/strict";
import { requireRole } from "../middleware/rbac_mw";
import type { RoleRequirement } from "../auth/rbac";
import { mountPolicyRoutes } from "../v1/routes_policies";

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

async function runHandlers(handlers: Array<(req: any, res: any, next?: any) => void>, req: any) {
  const { res, done } = createMockResponse();
  let index = 0;
  const next = (err?: any) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    const handler = handlers[index++];
    if (!handler) {
      if (!res.finished) res.end();
      return;
    }
    if (handler.length >= 3) {
      handler(req, res, next);
    } else {
      handler(req, res);
      if (!res.finished) next();
    }
  };
  next();
  await done;
  const body = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
  return { statusCode: res.statusCode, body };
}

function buildPolicyHandlers() {
  const handlers: Record<string, Array<(req: any, res: any, next?: any) => void>> = {};
  const router = {
    get: (path: string, ...routeHandlers: Array<(req: any, res: any, next?: any) => void>) => {
      handlers[`GET ${path}`] = routeHandlers;
    },
    post: (path: string, ...routeHandlers: Array<(req: any, res: any, next?: any) => void>) => {
      handlers[`POST ${path}`] = routeHandlers;
    },
  };

  const auditAdmin: RoleRequirement = { anyOf: ["auditor", "platform_admin"] };
  const adminOnly: RoleRequirement = { anyOf: ["platform_admin"] };

  mountPolicyRoutes(router as any, {
    read: requireRole(auditAdmin),
    admin: requireRole(adminOnly),
  });

  return handlers;
}

test("submit draft returns draft policy", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "1";

  try {
    const handlers = buildPolicyHandlers();
    const response = await runHandlers(handlers["POST /policies/draft"], {
      headers: { "x-edge-role": "platform_admin" },
      body: {
        version: "edge-clinical.v1.2.0",
        domain: "medicine",
        summary: "Draft policy",
        text: "version: edge-clinical.v1\n- id: SAMPLE\n",
      },
    });
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body.kind, "edge.ok");
    assert.strictEqual(response.body.data.policy.status, "draft");
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

test("publish draft sets published status", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "1";

  try {
    const handlers = buildPolicyHandlers();
    const response = await runHandlers(handlers["POST /policies/:version/publish"], {
      headers: { "x-edge-role": "platform_admin" },
      params: { version: "edge-clinical.v1.2.0" },
    });
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body.data.policy.status, "published");
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

test("publishing second policy unpublishes first", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "1";

  try {
    const handlers = buildPolicyHandlers();
    await runHandlers(handlers["POST /policies/draft"], {
      headers: { "x-edge-role": "platform_admin" },
      body: {
        version: "edge-clinical.v1.3.0",
        domain: "medicine",
        summary: "Second draft",
        text: "version: edge-clinical.v1\n- id: SECOND\n",
      },
    });

    const publish = await runHandlers(handlers["POST /policies/:version/publish"], {
      headers: { "x-edge-role": "platform_admin" },
      params: { version: "edge-clinical.v1.3.0" },
    });
    assert.strictEqual(publish.statusCode, 200);

    const active = await runHandlers(handlers["GET /policies/active/:domain"], {
      headers: { "x-edge-role": "auditor" },
      params: { domain: "medicine" },
    });
    assert.strictEqual(active.statusCode, 200);
    assert.strictEqual(active.body.data.policy.version, "edge-clinical.v1.3.0");
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

test("get active returns published policy", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "1";

  try {
    const handlers = buildPolicyHandlers();
    const active = await runHandlers(handlers["GET /policies/active/:domain"], {
      headers: { "x-edge-role": "auditor" },
      params: { domain: "medicine" },
    });
    assert.strictEqual(active.statusCode, 200);
    assert.ok(active.body.data.policy);
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

test("rbac enforced when auth enabled", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "1";

  try {
    const handlers = buildPolicyHandlers();
    const response = await runHandlers(handlers["POST /policies/draft"], {
      headers: {},
      body: {
        version: "edge-clinical.v1.4.0",
        domain: "medicine",
        summary: "Unauthorized draft",
        text: "version: edge-clinical.v1\n- id: UNAUTH\n",
      },
    });
    assert.strictEqual(response.statusCode, 403);
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
    console.log(`✓ All ${tests.length} policy publish tests passed.`);
  }
})();
