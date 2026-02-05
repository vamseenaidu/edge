import fs from "node:fs";
import path from "node:path";

const STRIP_KEYS = new Set([
  "created_at_ms",
  "updated_at_ms",
  "timestamp",
  "time",
  "date",
  "nonce",
  "request_id",
  "trace_id",
  "span_id",
]);

const GOLDEN_PATH = path.join(__dirname, "_golden__", "determinism_regression.json");

export function sanitizeForGolden(value: unknown): unknown {
  return sanitizeValue(value);
}

function sanitizeValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    const keys = Object.keys(value);
    for (const key of keys) {
      if (STRIP_KEYS.has(key)) continue;
      const raw = value[key];
      let next = sanitizeValue(raw);
      if (key === "job_id") {
        next = "<job_id>";
      }
      if (key === "id" && typeof raw === "string" && isJobRecord(value)) {
        next = "<job_id>";
      }
      result[key] = next;
    }
    return result;
  }
  return value;
}

function isJobRecord(value: any): boolean {
  return Boolean(value && typeof value === "object" && "kind" in value && "status" in value);
}

export function stableStringify(value: unknown): string {
  const sorted = sortKeys(value);
  return JSON.stringify(sorted, null, 2);
}

function sortKeys(value: any): any {
  if (Array.isArray(value)) {
    return value.map((entry) => sortKeys(entry));
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      result[key] = sortKeys(value[key]);
    }
    return result;
  }
  return value;
}

export function loadGoldenFixture(): unknown | null {
  if (!fs.existsSync(GOLDEN_PATH)) return null;
  const raw = fs.readFileSync(GOLDEN_PATH, "utf8");
  return JSON.parse(raw);
}

export function saveGoldenFixture(value: unknown): void {
  fs.mkdirSync(path.dirname(GOLDEN_PATH), { recursive: true });
  const payload = stableStringify(value);
  fs.writeFileSync(GOLDEN_PATH, `${payload}\n`, "utf8");
}

export function diffStrings(expected: string, actual: string): string {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const max = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < max; i += 1) {
    const exp = expectedLines[i];
    const act = actualLines[i];
    if (exp !== act) {
      return [
        `Line ${i + 1}:`,
        `- ${exp ?? ""}`,
        `+ ${act ?? ""}`,
      ].join("\n");
    }
  }
  return "No diff";
}
