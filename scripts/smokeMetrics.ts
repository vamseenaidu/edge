import { app } from "../src/index";

const assertNumber = (value: unknown, label: string): void => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} expected number`);
  }
};

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
    const healthRes = await fetchFn(baseUrl + "/healthz");
    if (!healthRes.ok) {
      throw new Error(`expected 200 from /healthz but got ${healthRes.status}`);
    }

    const healthJson = (await healthRes.json().catch(() => null)) as Record<string, unknown> | null;
    if (!healthJson || healthJson.ok !== true || !healthJson.service) {
      throw new Error("health payload missing required keys");
    }

    const getMetrics = async (): Promise<any> => {
      const res = await fetchFn(baseUrl + "/v1/metrics");
      if (!res.ok) {
        throw new Error(`expected 200 from /v1/metrics but got ${res.status}`);
      }
      return (await res.json()) as any;
    };

    const validateMetrics = (payload: any): void => {
      if (payload.cge_version !== "v1.0") {
        throw new Error("cge_version mismatch");
      }

      assertNumber(payload.total_requests, "total_requests");

      const keys = ["PROCEED", "ASK_CLARIFY", "REFUSE", "ESCALATE"];
      keys.forEach((key) => assertNumber(payload.decisions[key], `decisions.${key}`));

      const rateKeys = [
        "refusal_rate",
        "escalation_rate",
        "clarify_rate",
        "proceed_rate",
        "debug_enabled_rate",
      ];
      rateKeys.forEach((key) => assertNumber(payload.rates[key], `rates.${key}`));
    };

    const before = await getMetrics();
    validateMetrics(before);

    const groundRes = await fetchFn(baseUrl + "/v1/ground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "52-year-old male with chest pain and sweating.",
        domain: "medicine",
        debug: false,
      }),
    });

    if (groundRes.status !== 200) {
      throw new Error(`expected 200 from /v1/ground but got ${groundRes.status}`);
    }

    const after = await getMetrics();
    validateMetrics(after);

    if (after.total_requests !== before.total_requests + 1) {
      throw new Error("total_requests did not increment by 1");
    }

    if (after.decisions.ESCALATE !== before.decisions.ESCALATE + 1) {
      throw new Error("ESCALATE counter did not increment by 1");
    }

    console.log("metrics smoke ok");
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
