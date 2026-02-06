import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type RequestLogRecord = {
  v: 1;
  run_id: string;
  ts: string;
  request: {
    domain: "medicine" | "finance" | "legal";
    debug: boolean;
    query_sha256: string;
    query_preview: string;
  };
  decision: "PROCEED" | "ASK_CLARIFY" | "REFUSE" | "ESCALATE";
  meta: {
    cge_version: "v1.0";
    evidence_tiers_used: ("A" | "B" | "C" | "D")[];
    uncertainty_level: "LOW" | "MODERATE" | "HIGH";
    refusal_triggered: boolean;
  };
  audit_included: boolean;
  audit_fingerprint: string | null;
};

const runId = `${new Date().toISOString()}-${crypto.randomBytes(4).toString("hex")}`;

export function getRunId(): string {
  return runId;
}

export function loggingEnabled(): boolean {
  const disabled = process.env.CGE_DISABLE_LOG === "1";
  return !disabled;
}

const getLogDir = (): string => process.env.CGE_LOG_DIR ?? "runs";
const getLogFile = (): string => process.env.CGE_LOG_FILE ?? "requests.v1.jsonl";

export function getLogPath(): string {
  return path.join(getLogDir(), getLogFile());
}

export function makeQueryHash(query: string): string {
  return crypto.createHash("sha256").update(query).digest("hex");
}

export function makeQueryPreview(query: string, maxLen = 160): string {
  const normalized = query.trim().replace(/\s+/g, " ");
  return normalized.slice(0, maxLen);
}

export async function appendRequestLog(record: RequestLogRecord): Promise<void> {
  if (!loggingEnabled()) return;

  const logPath = getLogPath();
  await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
  const line = `${JSON.stringify(record)}\n`;
  await fs.promises.appendFile(logPath, line, { encoding: "utf-8" });
}
