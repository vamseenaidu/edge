export type ValidationFinding = { code: string; message: string; line?: number };
export type ValidationResult = { ok: boolean; findings: ValidationFinding[]; normalizedText: string };

type ValidateInput = { text: string; newVersion: string; baseVersion: string };

const VERSION_REGEX = /^[a-z0-9.-]+$/;

function normalizeText(text: string): string {
  const normalized = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");
  return normalized.replace(/\n*$/, "\n");
}

export function validatePolicyDraft(input: ValidateInput): ValidationResult {
  const normalizedText = normalizeText(input.text ?? "");
  const findings: ValidationFinding[] = [];
  const versionValue = input.newVersion.trim();

  if (!versionValue) {
    findings.push({ code: "VERSION_REQUIRED", message: "New version is required." });
  } else if (!VERSION_REGEX.test(versionValue)) {
    findings.push({
      code: "VERSION_INVALID",
      message: "New version must match ^[a-z0-9.-]+$.",
    });
  }

  if (normalizedText.trim().length === 0) {
    findings.push({ code: "EMPTY_TEXT", message: "Draft text is required." });
  }

  const lines = normalizedText.replace(/\n$/, "").split("\n");
  const hasVersionLine = lines.some((line) => line.startsWith("version:"));
  if (!hasVersionLine) {
    findings.push({
      code: "MISSING_VERSION_LINE",
      message: "Draft must include a line starting with 'version:'.",
    });
  }

  const hasRuleId = lines.some((line) => line.trimStart().startsWith("- id:"));
  if (!hasRuleId) {
    findings.push({
      code: "MISSING_RULE_ID",
      message: "Draft must include at least one '- id:' rule line.",
    });
  }

  lines.forEach((line, index) => {
    if (/dose|dosing/i.test(line)) {
      findings.push({
        code: "NO_DOSING",
        message: "Draft must not include dosing guidance.",
        line: index + 1,
      });
    }
  });

  findings.sort((a, b) => {
    const lineA = a.line ?? Number.MAX_SAFE_INTEGER;
    const lineB = b.line ?? Number.MAX_SAFE_INTEGER;
    if (lineA !== lineB) return lineA - lineB;
    return a.code.localeCompare(b.code);
  });

  return { ok: findings.length === 0, findings, normalizedText };
}
