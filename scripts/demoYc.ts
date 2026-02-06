import { app } from "../src/index";

const fetchFn = globalThis.fetch;

if (!fetchFn) {
  throw new Error("global fetch is not available in this runtime");
}

const portEnv = process.env.PORT;
const port = portEnv ? Number(portEnv) : 3000;
const host = "127.0.0.1";

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be a valid integer between 0 and 65535");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(baseUrl: string): Promise<boolean> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const res = await fetchFn(baseUrl + "/healthz");
      if (res.ok) {
        return true;
      }
    } catch (_err) {
      // Ignore errors and retry.
    }
    await sleep(200);
  }
  return false;
}

const server = app.listen(port, host);

server.on("error", (err) => {
  console.error("DEMO_YC_START_FAILED", err instanceof Error ? err.message : err);
  process.exit(1);
});

server.on("listening", async () => {
  const baseUrl = `http://${host}:${port}`;
  const healthy = await waitForHealth(baseUrl);
  if (!healthy) {
    console.error("DEMO_YC_HEALTH_TIMEOUT");
    process.exit(1);
  }

  console.log(`DEMO_URL=${baseUrl}/demo`);
  console.log(`API_URL=${baseUrl}/v1/ground`);
  console.log(`METRICS_URL=${baseUrl}/v1/metrics`);
});
