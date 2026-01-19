import crypto from "node:crypto";
import { Audit, GroundRequest, GroundResponse } from "../api/contract";

const refusalKeywords = [
  "dose",
  "dosage",
  "mg",
  "milligram",
  "ml",
  "milliliter",
  "how much",
  "take",
  "tablet",
  "pill",
  "augmentin",
  "self-treat",
  "self treat",
  "self-treatment",
  "self treatment",
  "procedure",
  "surgery",
  "inject",
  "injection",
  "apply",
  "prescription",
  "medication instructions",
  "taper",
];

const escalateIndicators = [
  "severe bleeding",
  "uncontrolled bleeding",
  "heavy bleeding",
  "stroke",
  "stroke symptoms",
  "slurred speech",
  "face droop",
  "one-sided weakness",
  "numbness on one side",
  "can't breathe",
  "cannot breathe",
  "trouble breathing",
  "short of breath",
  "unresponsive",
  "fainting",
  "passed out",
];

const clarifyIndicators = [
  "what should i do",
  "what should we do",
  "what do i do",
  "next steps",
  "for my dad",
  "for my mom",
  "for my father",
  "for my mother",
  "for my spouse",
  "for my wife",
  "for my husband",
  "for my child",
  "for my son",
  "for my daughter",
];

const normalizedIncludes = (content: string, needles: string[]): boolean => {
  return needles.some((needle) => content.includes(needle));
};

const hasChestPain = (content: string): boolean => content.includes("chest pain");

const hasSweating = (content: string): boolean => content.includes("sweating");

const hasAgeAtLeast50 = (content: string): boolean => {
  const patterns = [
    // Matches: "52 year old", "52-year-old"
    /\b(\d{2,3})\s?(?:year old|year-old)\b/,
    // Matches: "70-year-old" (hyphen between number and 'year')
    /\b(\d{2,3})-year-old\b/,
    // Matches: "age 63"
    /\bage\s*(\d{2,3})\b/,
    // Matches: "52M", "63F"
    /\b(\d{2,3})\s?(?:m|f)\b/,
  ];

  return patterns.some((pattern) => {
    const match = content.match(pattern);
    const ageStr = match?.[1];
    if (!ageStr) return false;
    const age = Number.parseInt(ageStr, 10);
    return Number.isInteger(age) && age >= 50 && age <= 120;
  });
};

const hasFamilyChestPain = (content: string): boolean => {
  return (
    hasChestPain(content) &&
    normalizedIncludes(content, ["dad", "father", "mom", "mother"])
  );
};

const hasChestPainWithSweating = (content: string): boolean => {
  return hasChestPain(content) && hasSweating(content);
};

const decisionPath = [
  "CHECK_REFUSE",
  "CHECK_ESCALATE",
  "CHECK_CLARIFY",
  "DEFAULT_PROCEED",
] as const;

const previewNormalizedQuery = (normalized: string): string => {
  return normalized.replace(/\s+/g, " ").trim().slice(0, 80);
};

const fingerprintQuery = (normalized: string): string => {
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12);
};

const buildAudit = (params: {
  normalized: string;
  signals: {
    hasChestPain: boolean;
    hasSweating: boolean;
    ageAtLeast50: boolean;
    familyChestPain: boolean;
    matchedRefusalKeyword: boolean;
    matchedEscalateIndicator: boolean;
    matchedClarifyIndicator: boolean;
  };
}): Audit => {
  const { normalized, signals } = params;
  const matchedRules: string[] = [];

  if (signals.matchedRefusalKeyword) {
    matchedRules.push("REFUSE_KEYWORD");
  }
  if (signals.hasChestPain && signals.hasSweating) {
    matchedRules.push("ESCALATE_CHEST_SWEAT");
  }
  if (signals.hasChestPain && signals.ageAtLeast50) {
    matchedRules.push("ESCALATE_CHEST_AGE");
  }
  if (signals.matchedEscalateIndicator) {
    matchedRules.push("ESCALATE_INDICATOR");
  }
  if (signals.familyChestPain) {
    matchedRules.push("ESCALATE_FAMILY");
  }
  if (signals.matchedClarifyIndicator) {
    matchedRules.push("CLARIFY_FOLLOWUP");
  }

  return {
    audit_version: "audit.v1",
    query_fingerprint: fingerprintQuery(normalized),
    normalized_query_preview: previewNormalizedQuery(normalized),
    signals: {
      has_chest_pain: signals.hasChestPain,
      has_sweating: signals.hasSweating,
      age_at_least_50: signals.ageAtLeast50,
      family_chest_pain: signals.familyChestPain,
      matched_refusal_keyword: signals.matchedRefusalKeyword,
      matched_escalate_indicator: signals.matchedEscalateIndicator,
      matched_clarify_indicator: signals.matchedClarifyIndicator,
    },
    matched_rules: matchedRules,
    decision_path: [...decisionPath],
  };
};

const buildGovernanceResponse = (
  decision: GroundResponse["decision"],
  meta: GroundResponse["meta"],
  audit?: Audit
): GroundResponse => ({
  cge_mode: true,
  decision,
  response: {
    clinical_summary:
      "Governance-only response: operational medical guidance is not provided.",
    what_is_known: [
      "The query relates to clinical decision support within the medicine domain.",
    ],
    what_depends_on_context: [
      "Appropriate actions depend on verified clinical data, in-person assessment, and jurisdictional standards.",
    ],
    what_is_uncertain: [
      "This system does not confirm diagnoses, dosing, or procedures.",
    ],
    when_to_escalate: [
      "When immediate risk is suspected, follow emergency protocols via local services.",
    ],
  },
  meta,
  ...(audit ? { audit } : {}),
});

const refusalMeta: GroundResponse["meta"] = {
  cge_version: "v1.0",
  evidence_tiers_used: ["D"],
  uncertainty_level: "HIGH",
  refusal_triggered: true,
};

const escalateMeta: GroundResponse["meta"] = {
  cge_version: "v1.0",
  evidence_tiers_used: ["C"],
  uncertainty_level: "HIGH",
  refusal_triggered: false,
};

const clarifyMeta: GroundResponse["meta"] = {
  cge_version: "v1.0",
  evidence_tiers_used: ["C"],
  uncertainty_level: "MODERATE",
  refusal_triggered: false,
};

const proceedMeta: GroundResponse["meta"] = {
  cge_version: "v1.0",
  evidence_tiers_used: ["C"],
  uncertainty_level: "LOW",
  refusal_triggered: false,
};

export const ground = (req: GroundRequest): GroundResponse => {
  const normalized = req.query.toLowerCase();

  const chestPainPresent = hasChestPain(normalized);
  const ageHighRisk = hasAgeAtLeast50(normalized);
  const sweatingPresent = hasSweating(normalized);
  const familyChestPain = hasFamilyChestPain(normalized);
  const refusalMatched =
    normalizedIncludes(normalized, refusalKeywords) ||
    normalized.includes("dose of") ||
    normalized.includes("how many");
  const escalateIndicatorMatched = normalizedIncludes(normalized, escalateIndicators);
  const clarifyMatched =
    normalizedIncludes(normalized, clarifyIndicators) || normalized.includes("what should i do");

  let decision: GroundResponse["decision"] = "PROCEED";
  let meta: GroundResponse["meta"] = proceedMeta;

  if (refusalMatched) {
    decision = "REFUSE";
    meta = refusalMeta;
  } else if (
    hasChestPainWithSweating(normalized) ||
    (chestPainPresent && ageHighRisk) ||
    escalateIndicatorMatched ||
    familyChestPain
  ) {
    // ESCALATE overrides clarification. In high-risk scenarios, do not ask follow-ups before escalation.
    decision = "ESCALATE";
    meta = escalateMeta;
  } else if (clarifyMatched) {
    decision = "ASK_CLARIFY";
    meta = clarifyMeta;
  }

  const audit = req.debug
    ? buildAudit({
        normalized,
        signals: {
          hasChestPain: chestPainPresent,
          hasSweating: sweatingPresent,
          ageAtLeast50: ageHighRisk,
          familyChestPain,
          matchedRefusalKeyword: refusalMatched,
          matchedEscalateIndicator: escalateIndicatorMatched,
          matchedClarifyIndicator: clarifyMatched,
        },
      })
    : undefined;

  return buildGovernanceResponse(decision, meta, audit);
};
