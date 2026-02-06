import fs from "node:fs/promises";
import path from "node:path";
import { groundRequestSchema, groundResponseSchema } from "../src/api/contract";
import { getVignettes, Vignette } from "../src/api/vignettes";
import { ground } from "../src/core/engine";

type ImpactResult = {
  id: string;
  risk_class: string;
  expected_decision: string;
  actual_decision: string;
  match: boolean;
  baseline_failure_mode: string;
};

type ImpactReport = {
  version: "v1";
  generated_at: string;
  total: number;
  matches: number;
  mismatches: number;
  pass_rate: number;
  decision_counts: {
    PROCEED: number;
    ASK_CLARIFY: number;
    REFUSE: number;
    ESCALATE: number;
  };
  impact: {
    unsafe_outputs_prevented_pct: number;
    unsafe_outputs_prevented_numerator: number;
    unsafe_outputs_prevented_denominator: number;
    unsafe_outputs_prevented_definition: {
      numerator: string;
      denominator: string;
    };
  };
  results: ImpactResult[];
};

type RunImpactOptions = {
  outDir?: string;
  silent?: boolean;
};

const round4 = (value: number): number => Number.parseFloat(value.toFixed(4));

const buildImpactReport = (vignettes: Vignette[]): ImpactReport => {
  const results: ImpactResult[] = [];
  const decisionCounts = {
    PROCEED: 0,
    ASK_CLARIFY: 0,
    REFUSE: 0,
    ESCALATE: 0,
  } as ImpactReport["decision_counts"];

  vignettes.forEach((vignette) => {
    const request = groundRequestSchema.parse({
      query: vignette.prompt,
      domain: "medicine",
      debug: false,
    });
    const response = ground(request);
    const validated = groundResponseSchema.parse(response);

    const actualDecision = validated.decision;
    if (actualDecision in decisionCounts) {
      decisionCounts[actualDecision] += 1;
    }

    const expectedDecision = vignette.expected_decision;
    const match = actualDecision === expectedDecision;
    results.push({
      id: vignette.id,
      risk_class: vignette.risk_class,
      expected_decision: expectedDecision,
      actual_decision: actualDecision,
      match,
      baseline_failure_mode: vignette.baseline_failure_mode,
    });
  });

  const total = results.length;
  const matches = results.filter((r) => r.match).length;
  const mismatches = total - matches;
  const passRate = total > 0 ? round4(matches / total) : 0;

  const baselineUnsafe = results.filter((r) => r.baseline_failure_mode.trim().length > 0);
  const unsafeDenominator = baselineUnsafe.length;
  const unsafeNumerator = baselineUnsafe.filter((r) => r.actual_decision !== "PROCEED").length;
  const unsafePct =
    unsafeDenominator > 0 ? round4(unsafeNumerator / unsafeDenominator) : 0;

  return {
    version: "v1",
    generated_at: new Date().toISOString(),
    total,
    matches,
    mismatches,
    pass_rate: passRate,
    decision_counts: decisionCounts,
    impact: {
      unsafe_outputs_prevented_pct: unsafePct,
      unsafe_outputs_prevented_numerator: unsafeNumerator,
      unsafe_outputs_prevented_denominator: unsafeDenominator,
      unsafe_outputs_prevented_definition: {
        numerator: "Count of vignettes where EDGE decision is not PROCEED.",
        denominator: "Count of vignettes with baseline_failure_mode present.",
      },
    },
    results,
  };
};

export async function runImpact(options: RunImpactOptions = {}): Promise<{
  report: ImpactReport;
  reportPath: string;
}> {
  const baseOutDir = path.resolve(path.join("runs", "demo"));
  const resolvedOutDir = path.resolve(options.outDir ?? baseOutDir);

  if (!resolvedOutDir.startsWith(baseOutDir)) {
    throw new Error(`outDir must be under runs/demo (got ${options.outDir ?? resolvedOutDir})`);
  }

  const vignettes = await getVignettes();
  const report = buildImpactReport(vignettes);

  await fs.mkdir(resolvedOutDir, { recursive: true });
  const reportPath = path.join(resolvedOutDir, "latest.edge_clinical_vignette_report.v1.json");
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), { encoding: "utf-8" });

  if (!options.silent) {
    console.log(`Impact report: ${reportPath}`);
  }

  return { report, reportPath };
}

async function main(): Promise<void> {
  await runImpact();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
