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
    const proceedRes = await fetchFn(baseUrl + "/v1/ground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Explain what a contract is.",
        domain: "legal",
        debug: false,
      }),
    });
    if (!proceedRes.ok) {
      throw new Error(`expected 200 from /v1/ground but got ${proceedRes.status}`);
    }
    const proceedJson = (await proceedRes.json()) as { decision?: string };
    if (proceedJson.decision !== "PROCEED") {
      throw new Error(`legal proceed case expected PROCEED but got ${String(proceedJson.decision)}`);
    }

    const refuseRes = await fetchFn(baseUrl + "/v1/ground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "Can you draft a contract for me?",
        domain: "legal",
        debug: false,
      }),
    });
    if (!refuseRes.ok) {
      throw new Error(`expected 200 from /v1/ground but got ${refuseRes.status}`);
    }
    const refuseJson = (await refuseRes.json()) as { decision?: string };
    if (refuseJson.decision !== "REFUSE") {
      throw new Error(`legal refuse case expected REFUSE but got ${String(refuseJson.decision)}`);
    }

    const escalateRes = await fetchFn(baseUrl + "/v1/ground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "I was served with a subpoena today.",
        domain: "legal",
        debug: false,
      }),
    });
    if (!escalateRes.ok) {
      throw new Error(`expected 200 from /v1/ground but got ${escalateRes.status}`);
    }
    const escalateJson = (await escalateRes.json()) as { decision?: string };
    if (escalateJson.decision !== "ESCALATE") {
      throw new Error(
        `legal escalate case expected ESCALATE but got ${String(escalateJson.decision)}`
      );
    }

    const auditRes = await fetchFn(baseUrl + "/v1/ground", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "What does legal advice mean?",
        domain: "legal",
        debug: true,
      }),
    });
    if (!auditRes.ok) {
      throw new Error(`expected 200 from /v1/ground but got ${auditRes.status}`);
    }
    const auditJson = (await auditRes.json()) as { audit?: { matched_rules?: string[] } };
    if (!auditJson.audit) {
      throw new Error("expected audit in debug response for legal domain");
    }
    if (!Array.isArray(auditJson.audit.matched_rules)) {
      throw new Error("audit matched_rules missing for legal domain");
    }
    if (!auditJson.audit.matched_rules.includes("DOMAIN_LEGAL")) {
      throw new Error("audit matched_rules missing DOMAIN_LEGAL");
    }

    console.log("legal smoke ok");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve(undefined)))
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
