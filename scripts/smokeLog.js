"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const requestLog_1 = require("../src/utils/requestLog");
// Write logs into an isolated smoke directory.
process.env.CGE_LOG_DIR = node_path_1.default.join("runs", "_smoke");
process.env.CGE_LOG_FILE = "smoke.jsonl";
process.env.CGE_DISABLE_LOG = "";
async function main() {
    const logPath = (0, requestLog_1.getLogPath)();
    await promises_1.default.mkdir(node_path_1.default.dirname(logPath), { recursive: true });
    await promises_1.default.rm(logPath, { force: true });
    const record = {
        v: 1,
        run_id: (0, requestLog_1.getRunId)(),
        ts: "2000-01-01T00:00:00.000Z",
        request: {
            domain: "medicine",
            debug: false,
            query_sha256: (0, requestLog_1.makeQueryHash)("smoke test query"),
            query_preview: (0, requestLog_1.makeQueryPreview)("smoke test query"),
        },
        decision: "PROCEED",
        meta: {
            cge_version: "v1.0",
            evidence_tiers_used: ["A"],
            uncertainty_level: "LOW",
            refusal_triggered: false,
        },
        audit_included: false,
        audit_fingerprint: null,
    };
    await (0, requestLog_1.appendRequestLog)(record);
    const content = await promises_1.default.readFile(logPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length !== 1) {
        console.error(`smoke log failed: expected 1 line, got ${lines.length}`);
        process.exit(1);
    }
    console.log(`smoke log wrote ${lines.length} line to ${logPath}`);
}
main().catch((err) => {
    console.error("smoke log error", err);
    process.exit(1);
});
