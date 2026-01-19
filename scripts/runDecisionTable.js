"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const engine_1 = require("../src/core/engine");
const contract_1 = require("../src/api/contract");
const metrics = __importStar(require("../src/core/metrics"));
const loadCases = () => {
    const filePath = path_1.default.join(__dirname, "../tests/decision_table.cge_v1.json");
    const raw = (0, fs_1.readFileSync)(filePath, "utf-8");
    return JSON.parse(raw);
};
const cases = loadCases();
const failures = [];
metrics.reset();
cases.forEach((testCase) => {
    try {
        const request = contract_1.groundRequestSchema.parse({
            query: testCase.query,
            domain: "medicine",
        });
        const response = (0, engine_1.ground)(request);
        const validated = contract_1.groundResponseSchema.parse(response);
        metrics.record(validated.decision, { debug: request.debug ?? false });
        if (validated.decision !== testCase.expect.decision) {
            failures.push(`${testCase.id}: decision expected ${testCase.expect.decision} but got ${validated.decision}`);
            return;
        }
        if (validated.meta.uncertainty_level !== testCase.expect.meta.uncertainty_level) {
            failures.push(`${testCase.id}: uncertainty_level expected ${testCase.expect.meta.uncertainty_level} but got ${validated.meta.uncertainty_level}`);
        }
        if (validated.meta.refusal_triggered !== testCase.expect.meta.refusal_triggered) {
            failures.push(`${testCase.id}: refusal_triggered expected ${testCase.expect.meta.refusal_triggered} but got ${validated.meta.refusal_triggered}`);
        }
        if (validated.audit !== undefined) {
            failures.push(`${testCase.id}: audit should be absent when debug=false`);
        }
    }
    catch (err) {
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
];
const auditCases = [
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
        const request = contract_1.groundRequestSchema.parse({
            query: testCase.query,
            domain: "medicine",
            debug: true,
        });
        const response = (0, engine_1.ground)(request);
        const validated = contract_1.groundResponseSchema.parse(response);
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
        if (JSON.stringify(validated.audit.decision_path) !==
            JSON.stringify(auditDecisionPath)) {
            failures.push(`${testCase.id}: decision_path mismatch expected ${auditDecisionPath.join(",")} but got ${validated.audit.decision_path.join(",")}`);
        }
        if (!Array.isArray(validated.audit.matched_rules)) {
            failures.push(`${testCase.id}: matched_rules should be an array`);
        }
    }
    catch (err) {
        failures.push(`${testCase.id}: exception ${err instanceof Error ? err.message : "unknown"}`);
    }
});
const expectedDecisionCounts = [...cases, ...auditCases].reduce((acc, testCase) => {
    acc[testCase.expect.decision] += 1;
    return acc;
}, {
    PROCEED: 0,
    ASK_CLARIFY: 0,
    REFUSE: 0,
    ESCALATE: 0,
});
const metricsSnapshot = metrics.snapshot();
if (metricsSnapshot.total_requests !== cases.length + auditCases.length) {
    failures.push(`metrics: total_requests expected ${cases.length + auditCases.length} but got ${metricsSnapshot.total_requests}`);
}
Object.keys(expectedDecisionCounts).forEach((decision) => {
    if (metricsSnapshot.decisions[decision] !== expectedDecisionCounts[decision]) {
        failures.push(`metrics: decision count for ${decision} expected ${expectedDecisionCounts[decision]} but got ${metricsSnapshot.decisions[decision]}`);
    }
});
if (metricsSnapshot.cge_version !== "v1.0") {
    failures.push(`metrics: cge_version expected v1.0 but got ${metricsSnapshot.cge_version}`);
}
if (metricsSnapshot.debug.enabled !== auditCases.length ||
    metricsSnapshot.debug.disabled !== cases.length) {
    failures.push(`metrics: debug counts expected enabled=${auditCases.length} disabled=${cases.length} but got enabled=${metricsSnapshot.debug.enabled} disabled=${metricsSnapshot.debug.disabled}`);
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
