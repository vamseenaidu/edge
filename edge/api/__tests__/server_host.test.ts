import assert from "node:assert/strict";
import { loadRuntimeConfig } from "../runtime/configService";

// Defaults
const defaults = loadRuntimeConfig({ env: {} as any });
assert.strictEqual(defaults.host, "0.0.0.0");
assert.strictEqual(defaults.port, 3000);

// HOST takes precedence
const hostOverride = loadRuntimeConfig({ env: { HOST: "127.0.0.1" } as any });
assert.strictEqual(hostOverride.host, "127.0.0.1");

// EDGE_HOST overrides HOST
const edgeHost = loadRuntimeConfig({ env: { HOST: "127.0.0.1", EDGE_HOST: "0.0.0.0" } as any });
assert.strictEqual(edgeHost.host, "0.0.0.0");

// Invalid port throws
assert.throws(() => loadRuntimeConfig({ env: { PORT: "-1" } as any }), /Invalid PORT value/);

// eslint-disable-next-line no-console
console.log("✓ server host resolution defaults to 0.0.0.0");
