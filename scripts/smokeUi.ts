import { AddressInfo } from "node:net";
import { app } from "../src/index";

async function main() {
  const fetchFn: typeof fetch | undefined = (globalThis as unknown as { fetch?: typeof fetch }).fetch;
  if (!fetchFn) {
    throw new Error("global fetch is not available in this runtime");
  }

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.on("listening", resolve));

  const address = server.address() as AddressInfo | null;
  if (!address) {
    throw new Error("server did not expose an address");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const rootRes = await fetchFn(baseUrl + "/");
    const rootBody = await rootRes.text();
    if (rootRes.status !== 200) {
      throw new Error(`expected 200 from / but got ${rootRes.status}`);
    }
    if (!rootBody.includes("CGE API v1.0")) {
      throw new Error("root payload missing CGE API v1.0");
    }

    const healthRes = await fetchFn(baseUrl + "/healthz");
    if (!healthRes.ok) {
      throw new Error(`expected 200 from /healthz but got ${healthRes.status}`);
    }
    const healthJson = (await healthRes.json().catch(() => null)) as unknown;
    if (
      !healthJson ||
      typeof healthJson !== "object" ||
      !("ok" in healthJson) ||
      (healthJson as { ok?: unknown }).ok !== true
    ) {
      throw new Error("healthz response missing ok flag");
    }

    console.log("ui smoke ok");
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
