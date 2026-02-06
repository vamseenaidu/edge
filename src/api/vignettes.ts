import { promises as fs } from "node:fs";
import path from "node:path";

export type Vignette = {
  id: string;
  prompt: string;
  risk_class: string;
  expected_decision: string;
  baseline_failure_mode: string;
};

const vignettePath = path.resolve(__dirname, "..", "..", "artifacts", "clinical_vignettes.v1.json");

let cachedVignettes: Vignette[] | null = null;

const toString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  return String(value);
};

const normalizeVignette = (input: unknown): Vignette | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const data = input as Record<string, unknown>;
  const id = toString(data.id).trim();
  const prompt = toString(data.prompt).trim();
  const riskClass = toString(data.risk_class ?? data.riskClass).trim();
  const expectedDecision = toString(
    data.expected_decision ?? data.expected_edge_decision ?? data.expectedDecision,
  ).trim();
  const baselineFailureMode = toString(
    data.baseline_failure_mode ?? data.baselineFailureMode,
  ).trim();

  if (!id || !prompt || !expectedDecision || !baselineFailureMode) {
    return null;
  }

  return {
    id,
    prompt,
    risk_class: riskClass || "UNKNOWN",
    expected_decision: expectedDecision,
    baseline_failure_mode: baselineFailureMode,
  };
};

const loadFile = async (): Promise<unknown> => {
  const raw = await fs.readFile(vignettePath, "utf-8");
  return JSON.parse(raw);
};

export async function getVignettes(): Promise<Vignette[]> {
  if (cachedVignettes) {
    return cachedVignettes;
  }

  const parsed = await loadFile().catch((err: NodeJS.ErrnoException) => {
    if (err?.code === "ENOENT") {
      const missingError = new Error("VIGNETTES_NOT_FOUND");
      missingError.name = "VIGNETTES_NOT_FOUND";
      throw missingError;
    }
    throw err;
  });

  const maybeArray = Array.isArray(parsed) ? parsed : (parsed as { vignettes?: unknown }).vignettes;
  if (!Array.isArray(maybeArray)) {
    throw new Error("VIGNETTES_INVALID");
  }

  const normalized = maybeArray
    .map((item) => normalizeVignette(item))
    .filter((item): item is Vignette => item !== null)
    .sort((a, b) => a.id.localeCompare(b.id));

  cachedVignettes = normalized;
  return normalized;
}
