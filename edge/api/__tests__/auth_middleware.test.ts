import assert from "node:assert/strict";
import request from "supertest";
import { createServer } from "../server";
import { createAuthMiddleware } from "../middleware/auth_mw";
import { hashRequestCanonical } from "../../logging/hash";
import type { ActorContext } from "../auth/types";

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
function test(name: string, run: () => Promise<void> | void) {
  tests.push({ name, run });
}

const runMiddleware = (req: any, res: any, mw: (req: any, res: any, next: (err?: any) => void) => void) =>
  new Promise<void>((resolve, reject) => {
    mw(req, res, (err?: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

// (a) Requests succeed identically with auth disabled

test("auth disabled allows requests unchanged", async () => {
  const original = process.env.EDGE_AUTH_ENABLED;
  process.env.EDGE_AUTH_ENABLED = "0";

  try {
    const app = createServer();
    const res = await request(app)
      .get("/api/v1/health/live")
      .set({
        Authorization: "Bearer header.payload.signature",
        "x-edge-actor-id": "actor-123",
        "x-edge-actor-type": "human",
        "x-edge-auth-provider": "oidc",
      })
      .expect(200);
    assert.strictEqual(res.body.kind, "edge.ok");
    assert.strictEqual(res.body.data.status, "live");
  } finally {
    process.env.EDGE_AUTH_ENABLED = original;
  }
});

// (b) Actor context is null when no auth present

test("actor context is null when headers are absent", async () => {
  const req: any = { headers: {} };
  const res: any = {};
  const middleware = createAuthMiddleware({ enabled: true });
  await runMiddleware(req, res, middleware);
  assert.strictEqual(req.edge_actor, null);
});

// Parsing behavior when enabled

test("actor headers map into actor context", async () => {
  const req: any = {
    headers: {
      "x-edge-actor-id": "actor-007",
      "x-edge-actor-type": "service",
      "x-edge-auth-provider": "saml",
    },
  };
  const res: any = {};
  const middleware = createAuthMiddleware({ enabled: true });
  await runMiddleware(req, res, middleware);
  const actor = req.edge_actor as ActorContext;
  assert.ok(actor);
  assert.strictEqual(actor.actor_id, "actor-007");
  assert.strictEqual(actor.actor_type, "service");
  assert.strictEqual(actor.auth_provider, "saml");
});

test("authorization bearer token maps JWT sub to actor_id", async () => {
  const toBase64Url = (value: string) =>
    Buffer.from(value, "utf8")
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = toBase64Url(JSON.stringify({ sub: "actor-jwt" }));
  const token = `${header}.${payload}.sig`;

  const req: any = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  const res: any = {};
  const middleware = createAuthMiddleware({ enabled: true });
  await runMiddleware(req, res, middleware);
  const actor = req.edge_actor as ActorContext;
  assert.ok(actor);
  assert.strictEqual(actor.actor_id, "actor-jwt");
  assert.strictEqual(actor.actor_type, null);
  assert.strictEqual(actor.auth_provider, "none");
});

// (c) No effect on determinism or audit artifacts

test("auth middleware does not mutate request payload", async () => {
  const payload = { b: { y: 2, x: 1 }, a: 3 };
  const req: any = { headers: {}, body: JSON.parse(JSON.stringify(payload)) };
  const res: any = {};
  const middleware = createAuthMiddleware({ enabled: true });
  const before = hashRequestCanonical(req.body);
  await runMiddleware(req, res, middleware);
  const after = hashRequestCanonical(req.body);
  assert.deepStrictEqual(after, before);
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
    console.log(`✓ All ${tests.length} auth middleware tests passed.`);
  }
})();
