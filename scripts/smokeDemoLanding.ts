import { app } from "../src/index";

async function main(): Promise<void> {
  const fetchFn = globalThis.fetch;
  if (!fetchFn) {
    throw new Error("global fetch is not available in this runtime");
  }

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.on("listening", resolve));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("server did not expose an address");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const demoRes = await fetchFn(baseUrl + "/demo");
    const demoBody = await demoRes.text();
    if (demoRes.status !== 200) {
      throw new Error(`expected 200 from /demo but got ${demoRes.status}`);
    }

    if (!demoBody.includes("EDGE Clinical v1.0 — Deterministic Governance Demo")) {
      throw new Error("demo landing missing expected title");
    }

    const healthRes = await fetchFn(baseUrl + "/healthz");
    if (!healthRes.ok) {
      throw new Error(`expected 200 from /healthz but got ${healthRes.status}`);
    }

    const latestRes = await fetchFn(baseUrl + "/v1/reports/latest");
    const latestJson = (await latestRes.json().catch(() => null)) as any;
    if (!latestJson || typeof latestJson !== "object" || !("ok" in latestJson)) {
      throw new Error("latest report payload invalid");
    }

    if (latestJson.ok === true) {
      if (!("report" in latestJson)) {
        throw new Error("latest report missing report field");
      }
    } else if (latestJson.ok === false) {
      if (latestJson.error !== "REPORT_NOT_FOUND") {
        throw new Error("latest report missing deterministic error");
      }
    } else {
      throw new Error("latest report ok flag must be boolean");
    }

    console.log("demo landing smoke ok");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve(undefined))),
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
