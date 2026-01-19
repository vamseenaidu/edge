import fs from "node:fs/promises";
import path from "node:path";
import {
  RequestLogRecord,
  appendRequestLog,
  getLogPath,
  getRunId,
  makeQueryHash,
  makeQueryPreview,
} from "../src/utils/requestLog";

// Write logs into an isolated smoke directory.
process.env.CGE_LOG_DIR = path.join("runs", "_smoke");
process.env.CGE_LOG_FILE = "smoke.jsonl";
process.env.CGE_DISABLE_LOG = "";

async function main() {
  const logPath = getLogPath();
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.rm(logPath, { force: true });

  const record: RequestLogRecord = {
    v: 1,
    run_id: getRunId(),
    ts: "2000-01-01T00:00:00.000Z",
    request: {
      domain: "medicine",
      debug: false,
      query_sha256: makeQueryHash("smoke test query"),
      query_preview: makeQueryPreview("smoke test query"),
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

  await appendRequestLog(record);

  const content = await fs.readFile(logPath, "utf-8");
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
