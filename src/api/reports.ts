import fs from "node:fs/promises";
import path from "node:path";

const REPORT_RELATIVE_PATH = path.join(
  "runs",
  "demo",
  "latest.edge_clinical_vignette_report.v1.json",
);

export const latestReportRelativePath = REPORT_RELATIVE_PATH;

export type LatestReportResponse =
  | { ok: true; report: unknown; path: string }
  | { ok: false; error: "REPORT_NOT_FOUND"; report: null; path: null };

export async function readLatestReport(): Promise<LatestReportResponse> {
  const absolutePath = path.resolve(process.cwd(), REPORT_RELATIVE_PATH);

  try {
    const raw = await fs.readFile(absolutePath, "utf8");
    const parsed = JSON.parse(raw);
    return { ok: true, report: parsed, path: REPORT_RELATIVE_PATH };
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return { ok: false, error: "REPORT_NOT_FOUND", report: null, path: null };
    }
    throw err;
  }
}
