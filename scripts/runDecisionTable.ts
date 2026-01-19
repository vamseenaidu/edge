import { readFileSync } from "fs";
import path from "path";
import { ground } from "../src/core/engine";
import {
  GroundResponse,
  groundRequestSchema,
  groundResponseSchema,
} from "../src/api/contract";
import * as metrics from "../src/core/metrics";

type DecisionCase = {
  id: string;
  query: string;
  expect: {
    decision: GroundResponse["decision"];
    meta: Pick<GroundResponse["meta"], "uncertainty_level" | "refusal_triggered">;
  };
};

const loadCases = (): DecisionCase[] => {
  const filePath = path.join(__dirname, "../tests/decision_table.cge_v1.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as DecisionCase[];
};

const cases = loadCases();

const failures: string[] = [];

metrics.reset();

cases.forEach((testCase) => {
  try {
    const request = groundRequestSchema.parse({
      query: testCase.query,
      domain: "medicine",
    });

    const response = ground(request);
    const validated = groundResponseSchema.parse(response);

    metrics.record(validated.decision, { debug: request.debug ?? false });

    if (validated.decision !== testCase.expect.decision) {
      failures.push(
        `${testCase.id}: decision expected ${testCase.expect.decision} but got ${validated.decision}`
      );
      return;
    }

    if (validated.meta.uncertainty_level !== testCase.expect.meta.uncertainty_level) {
      failures.push(
        `${testCase.id}: uncertainty_level expected ${testCase.expect.meta.uncertainty_level} but got ${validated.meta.uncertainty_level}`
      );
    }

    if (validated.meta.refusal_triggered !== testCase.expect.meta.refusal_triggered) {
      failures.push(
        `${testCase.id}: refusal_triggered expected ${testCase.expect.meta.refusal_triggered} but got ${validated.meta.refusal_triggered}`
      );
    }

    if (validated.audit !== undefined) {
      failures.push(`${testCase.id}: audit should be absent when debug=false`);
    }
  } catch (err) {
    failures.push(`${testCase.id}: exception ${err instanceof Error ? err.message : "unknown"}`);
  }
});

cases.forEach((testCase) => {
  const status = failures.some((f) => f.startsWith(`${testCase.id}:`)) ? "FAIL" : "PASS";
  console.log(`${status} ${testCase.id} - ${testCase.query}`);
});

const auditDecisionPath = [
  "CHECK_REFUSE",
  "CHECK_ESCALATE",
  "CHECK_CLARIFY",
  "DEFAULT_PROCEED",
] as const;

const auditCases: DecisionCase[] = [
  {
    id: "audit_refuse",
    query: "How many mg of ibuprofen should I take?",
    expect: { decision: "REFUSE", meta: { uncertainty_level: "HIGH", refusal_triggered: true } },
  },
  {
    id: "audit_escalate",
    query: "Chest pain and sweating, please advise",
    expect: { decision: "ESCALATE", meta: { uncertainty_level: "HIGH", refusal_triggered: false } },
  },
  {
    id: "audit_proceed",
    query: "What are evidence tiers in clinical research?",
    expect: { decision: "PROCEED", meta: { uncertainty_level: "LOW", refusal_triggered: false } },
  },
];

auditCases.forEach((testCase) => {
  try {
    const request = groundRequestSchema.parse({
      query: testCase.query,
      domain: "medicine",
      debug: true,
    });

    const response = ground(request);
    const validated = groundResponseSchema.parse(response);

    metrics.record(validated.decision, { debug: request.debug ?? false });

    if (validated.audit === undefined) {
      failures.push(`${testCase.id}: audit missing when debug=true`);
      return;
    }

    if (validated.audit.audit_version !== "audit.v1") {
      failures.push(`${testCase.id}: audit_version expected audit.v1 but got ${validated.audit.audit_version}`);
    }

    if (validated.audit.query_fingerprint.length !== 12) {
      failures.push(`${testCase.id}: query_fingerprint length expected 12 but got ${validated.audit.query_fingerprint.length}`);
    }

    if (
      JSON.stringify(validated.audit.decision_path) !==
      JSON.stringify(auditDecisionPath)
    ) {
      failures.push(
        `${testCase.id}: decision_path mismatch expected ${auditDecisionPath.join(
          ","
        )} but got ${validated.audit.decision_path.join(",")}`
      );
    }

    if (!Array.isArray(validated.audit.matched_rules)) {
      failures.push(`${testCase.id}: matched_rules should be an array`);
    }
  } catch (err) {
    failures.push(`${testCase.id}: exception ${err instanceof Error ? err.message : "unknown"}`);
  }
});

const expectedDecisionCounts = [...cases, ...auditCases].reduce(
  (acc, testCase) => {
    acc[testCase.expect.decision] += 1;
    return acc;
  },
  {
    PROCEED: 0,
    ASK_CLARIFY: 0,
    REFUSE: 0,
    ESCALATE: 0,
  } as Record<GroundResponse["decision"], number>
);

const metricsSnapshot = metrics.snapshot();

if (metricsSnapshot.total_requests !== cases.length + auditCases.length) {
  failures.push(
    `metrics: total_requests expected ${cases.length + auditCases.length} but got ${metricsSnapshot.total_requests}`
  );
}

(Object.keys(expectedDecisionCounts) as GroundResponse["decision"][]).forEach((decision) => {
  if (metricsSnapshot.decisions[decision] !== expectedDecisionCounts[decision]) {
    failures.push(
      `metrics: decision count for ${decision} expected ${expectedDecisionCounts[decision]} but got ${metricsSnapshot.decisions[decision]}`
    );
  }
});

if (metricsSnapshot.cge_version !== "v1.0") {
  failures.push(`metrics: cge_version expected v1.0 but got ${metricsSnapshot.cge_version}`);
}

if (
  metricsSnapshot.debug.enabled !== auditCases.length ||
  metricsSnapshot.debug.disabled !== cases.length
) {
  failures.push(
    `metrics: debug counts expected enabled=${auditCases.length} disabled=${cases.length} but got enabled=${metricsSnapshot.debug.enabled} disabled=${metricsSnapshot.debug.disabled}`
  );
}

const rateValues = Object.values(metricsSnapshot.rates);
if (rateValues.some((rate) => Number.isNaN(rate))) {
  failures.push("metrics: rates should not be NaN");
}

if (failures.length) {
  console.error("\nFailures:");
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}
