import { app } from "../src/index";
import { groundRequestSchema, groundResponseSchema } from "../src/api/contract";
import { getVignettes } from "../src/api/vignettes";
import { ground } from "../src/core/engine";
import { runImpact } from "./runImpact";

const assertNumber = (value: unknown, label: string): void => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} expected number`);
  }
};

const round4 = (value: number): number => Number.parseFloat(value.toFixed(4));

const requireVignette = (v: Record<string, string> | undefined, idx: number): Record<string, string> => {
  if (!v) {
    throw new Error(`VIGNETTE_MISSING at index ${idx}`);
  }
  return v;
};

const requireId = (v: Record<string, string>, idx: number): string => {
  if (typeof v.id === "string" && v.id.trim().length > 0) {
    return v.id;
  }
  throw new Error(`VIGNETTE_ID_MISSING at index ${idx}`);
};

async function main(): Promise<void> {
  const fetchFn = globalThis.fetch;
  if (!fetchFn) {
    throw new Error("global fetch is not available in this runtime");
  }

  const vignettes = await getVignettes();
  const baselineUnsafe = vignettes.filter((v) => v.baseline_failure_mode.trim().length > 0);
  const expectedDenominator = baselineUnsafe.length;
  const expectedNumerator = baselineUnsafe.reduce((acc, vignette) => {
    const request = groundRequestSchema.parse({
      query: vignette.prompt,
      domain: "medicine",
      debug: false,
    });
    const response = ground(request);
    const validated = groundResponseSchema.parse(response);
    return acc + (validated.decision !== "PROCEED" ? 1 : 0);
  }, 0);
  const expectedPct =
    expectedDenominator > 0 ? round4(expectedNumerator / expectedDenominator) : 0;

  await runImpact({ silent: true });

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.on("listening", resolve));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("server did not expose an address");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const reportRes = await fetchFn(baseUrl + "/v1/reports/latest.json");
    if (!reportRes.ok) {
      throw new Error(`expected 200 from /v1/reports/latest.json but got ${reportRes.status}`);
    }

    const reportJson = (await reportRes.json()) as any;
    if (!reportJson || typeof reportJson !== "object") {
      throw new Error("report payload invalid");
    }

    const impact = reportJson.impact ?? {};
    assertNumber(impact.unsafe_outputs_prevented_pct, "impact.unsafe_outputs_prevented_pct");
    assertNumber(
      impact.unsafe_outputs_prevented_numerator,
      "impact.unsafe_outputs_prevented_numerator",
    );
    assertNumber(
      impact.unsafe_outputs_prevented_denominator,
      "impact.unsafe_outputs_prevented_denominator",
    );

    if (impact.unsafe_outputs_prevented_pct !== expectedPct) {
      throw new Error(
        `unsafe_outputs_prevented_pct expected ${expectedPct} but got ${impact.unsafe_outputs_prevented_pct}`,
      );
    }
    if (impact.unsafe_outputs_prevented_numerator !== expectedNumerator) {
      throw new Error(
        `unsafe_outputs_prevented_numerator expected ${expectedNumerator} but got ${impact.unsafe_outputs_prevented_numerator}`,
      );
    }
    if (impact.unsafe_outputs_prevented_denominator !== expectedDenominator) {
      throw new Error(
        `unsafe_outputs_prevented_denominator expected ${expectedDenominator} but got ${impact.unsafe_outputs_prevented_denominator}`,
      );
    }

    // Sanity-check a subset of vignettes against /v1/ground.
    const vignetteRes = await fetchFn(baseUrl + "/v1/vignettes");
    if (!vignetteRes.ok) {
      throw new Error(`expected 200 from /v1/vignettes but got ${vignetteRes.status}`);
    }
    const vignettesJson = (await vignetteRes.json()) as Array<Record<string, string>>;
    if (!Array.isArray(vignettesJson) || vignettesJson.length < 1) {
      throw new Error("vignettes payload invalid");
    }

    const subset = vignettesJson.slice(0, 3);
    const results: Array<{ id: string; expected: string; actual: string; match: boolean }> = [];

    for (let idx = 0; idx < subset.length; idx += 1) {
      const v = requireVignette(subset[idx], idx);
      const id = requireId(v, idx);
      const expected = (v.expected_decision ?? v.expected_edge_decision ?? "").toString();
      const res = await fetchFn(baseUrl + "/v1/ground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: v.prompt, domain: "medicine", debug: false }),
      });
      if (res.status !== 200) {
        throw new Error(`expected 200 from /v1/ground but got ${res.status}`);
      }
      const json = (await res.json()) as { decision?: string };
      const actual = (json.decision ?? "").toString();
      results.push({ id, expected, actual, match: actual === expected });
    }

    const decisionCounts = {
      PROCEED: 0,
      ASK_CLARIFY: 0,
      REFUSE: 0,
      ESCALATE: 0,
    };

    results.forEach((r) => {
      if (r.actual in decisionCounts) {
        decisionCounts[r.actual as keyof typeof decisionCounts] += 1;
      }
    });

    const total = results.length;
    const matches = results.filter((r) => r.match).length;
    const mismatches = total - matches;
    const passRate = total > 0 ? Number((matches / total).toFixed(4)) : 0;

    if (passRate < 0 || passRate > 1) {
      throw new Error("pass_rate out of range");
    }

    const sumDecisions =
      decisionCounts.PROCEED +
      decisionCounts.ASK_CLARIFY +
      decisionCounts.REFUSE +
      decisionCounts.ESCALATE;

    if (sumDecisions !== total) {
      throw new Error("decision_counts sum mismatch");
    }

    const parsedDate = Date.parse(reportJson.generated_at);
    if (Number.isNaN(parsedDate)) {
      throw new Error("generated_at is not ISO-8601");
    }

    console.log("impact smoke ok");
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
