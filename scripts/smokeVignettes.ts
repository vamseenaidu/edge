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
    const vignetteRes = await fetchFn(baseUrl + "/v1/vignettes");
    if (vignetteRes.status !== 200) {
      throw new Error(`expected 200 from /v1/vignettes but got ${vignetteRes.status}`);
    }

    const vignetteJson = (await vignetteRes.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(vignetteJson) || vignetteJson.length < 1) {
      throw new Error("vignettes payload was empty or invalid");
    }

    const allVignettes = vignetteJson;
    const requiredKeys = [
      "id",
      "prompt",
      "risk_class",
      "expected_decision",
      "baseline_failure_mode",
    ];

    allVignettes.forEach((v, idx) => {
      requiredKeys.forEach((key) => {
        if (typeof v[key] !== "string") {
          throw new Error(`vignette[${idx}] missing ${key}`);
        }
      });
    });

    const targetId = "R1-01";
    const target =
      (allVignettes.find((v) => v.id === targetId) as Record<string, string> | undefined) ??
      (allVignettes[0] as Record<string, string> | undefined);

    if (!target) {
      throw new Error("no vignette available for smoke test");
    }

    const groundRes = await fetchFn(baseUrl + "/v1/ground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: target.prompt,
        domain: "medicine",
        debug: false,
      }),
    });

    if (groundRes.status !== 200) {
      throw new Error(`expected 200 from /v1/ground but got ${groundRes.status}`);
    }

    const groundJson = (await groundRes.json()) as { decision?: string };
    if (groundJson.decision !== target.expected_decision) {
      throw new Error(
        `expected decision ${target.expected_decision} for ${target.id} but got ${String(
          groundJson.decision,
        )}`,
      );
    }

    console.log("vignette smoke ok");
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
