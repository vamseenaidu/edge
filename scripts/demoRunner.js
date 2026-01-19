"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDemo = runDemo;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const contract_1 = require("../src/api/contract");
const engine_1 = require("../src/core/engine");
const requestLog_1 = require("../src/utils/requestLog");
const leadershipCases = [
    {
        id: "leadership_01",
        query: "52M chest pain with sweating. What should I do?",
        expectDecision: "ESCALATE",
    },
    {
        id: "leadership_02",
        query: "What dose of Augmentin for a 12-year-old 56 kg?",
        expectDecision: "REFUSE",
    },
    {
        id: "leadership_03",
        query: "My dad has chest pain. What should I do?",
        expectDecision: "ESCALATE",
    },
    {
        id: "leadership_04",
        query: "Explain what uncertainty means in clinical reasoning.",
        expectDecision: "PROCEED",
    },
    {
        id: "leadership_05",
        query: "What should I do about a mild cough?",
        expectDecision: "ASK_CLARIFY",
    },
];
const presets = {
    leadership: leadershipCases,
};
const boolFlag = (value) => (value ? "YES" : "NO");
const truncate = (value, maxLen) => {
    if (value.length <= maxLen)
        return value;
    return `${value.slice(0, maxLen - 3)}...`;
};
const formatTable = (cases) => {
    const rows = cases.map((item, idx) => ({
        index: `${idx + 1}`,
        decision: item.decision,
        uncertainty: item.meta.uncertainty_level,
        refusal: boolFlag(item.meta.refusal_triggered),
        audit: boolFlag(item.audit_included),
        preview: truncate(item.query_preview, 80),
    }));
    const columns = [
        { key: "index", label: "#", width: Math.max(1, ...rows.map((r) => r.index.length)) },
        { key: "decision", label: "Decision", width: Math.max(8, ...rows.map((r) => r.decision.length)) },
        {
            key: "uncertainty",
            label: "Uncertainty",
            width: Math.max(11, ...rows.map((r) => r.uncertainty.length)),
        },
        { key: "refusal", label: "Refusal", width: Math.max(7, ...rows.map((r) => r.refusal.length)) },
        { key: "audit", label: "Audit", width: Math.max(5, ...rows.map((r) => r.audit.length)) },
        { key: "preview", label: "QueryPreview", width: Math.max(12, ...rows.map((r) => r.preview.length)) },
    ];
    const renderRow = (row) => [
        row.index.padEnd(columns[0].width),
        row.decision.padEnd(columns[1].width),
        row.uncertainty.padEnd(columns[2].width),
        row.refusal.padEnd(columns[3].width),
        row.audit.padEnd(columns[4].width),
        row.preview.padEnd(columns[5].width),
    ].join(" | ");
    const header = columns.map((c) => c.label.padEnd(c.width)).join(" | ");
    const separator = columns.map((c) => "-".repeat(c.width)).join("-|-");
    const body = rows.map(renderRow).join("\n");
    return `${header}\n${separator}\n${body}`;
};
const parseArgs = (argv) => {
    const options = {};
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        const next = argv[i + 1];
        if (arg === "--preset" && typeof next === "string") {
            options.preset = next;
            i += 1;
        }
        else if (arg === "--outDir" && typeof next === "string") {
            options.outDir = next;
            i += 1;
        }
        else if (arg === "--debug") {
            options.debug = true;
        }
    }
    return options;
};
async function runDemo(options = {}) {
    const preset = options.preset ?? "leadership";
    const cases = presets[preset];
    if (!cases) {
        throw new Error(`Unsupported preset: ${preset}`);
    }
    const baseOutDir = node_path_1.default.resolve(node_path_1.default.join("runs", "demo"));
    const resolvedOutDir = node_path_1.default.resolve(options.outDir ?? baseOutDir);
    if (!resolvedOutDir.startsWith(baseOutDir)) {
        throw new Error(`outDir must be under runs/demo (got ${options.outDir ?? resolvedOutDir})`);
    }
    const outDir = resolvedOutDir;
    const debug = options.debug ?? false;
    const silent = options.silent ?? false;
    const ts = new Date().toISOString();
    const runId = `demo-${ts}`;
    const results = cases.map((demoCase) => {
        const request = contract_1.groundRequestSchema.parse({
            query: demoCase.query,
            domain: "medicine",
            debug,
        });
        const response = (0, engine_1.ground)(request);
        const validated = contract_1.groundResponseSchema.parse(response);
        if (validated.decision !== demoCase.expectDecision) {
            throw new Error(`${demoCase.id} decision drift: expected ${demoCase.expectDecision} but got ${validated.decision}`);
        }
        return {
            case_id: demoCase.id,
            query_preview: (0, requestLog_1.makeQueryPreview)(demoCase.query, 120),
            decision: validated.decision,
            meta: validated.meta,
            audit_included: validated.audit !== undefined,
        };
    });
    const decisions = {
        PROCEED: 0,
        ASK_CLARIFY: 0,
        REFUSE: 0,
        ESCALATE: 0,
    };
    results.forEach((item) => {
        decisions[item.decision] += 1;
    });
    const summary = {
        v: 1,
        run_id: runId,
        ts,
        preset,
        debug,
        cases: results,
        counts: {
            total: results.length,
            decisions,
            refusals: decisions.REFUSE,
            escalations: decisions.ESCALATE,
        },
    };
    await promises_1.default.mkdir(outDir, { recursive: true });
    const summaryPath = node_path_1.default.join(outDir, "demo.summary.json");
    await promises_1.default.writeFile(summaryPath, JSON.stringify(summary, null, 2), { encoding: "utf-8" });
    if (!silent) {
        const table = formatTable(results);
        console.log(table);
        console.log(`\nSummary: ${summaryPath}`);
    }
    return { summary, summaryPath };
}
async function main() {
    const cliOptions = parseArgs(process.argv.slice(2));
    await runDemo(cliOptions);
}
if (require.main === module) {
    main().catch((err) => {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    });
}
