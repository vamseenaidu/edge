import crypto from "node:crypto";
import { Audit, GroundRequest, GroundResponse } from "../api/contract";
import { financeSchema } from "./finance_schema";

const decisionPath = [
  "CHECK_REFUSE",
  "CHECK_ESCALATE",
  "CHECK_CLARIFY",
  "DEFAULT_PROCEED",
] as const;

const normalizeQuery = (query: string): string => query.toLowerCase().replace(/\s+/g, " ").trim();

const previewNormalizedQuery = (normalized: string): string =>
  normalized.replace(/\s+/g, " ").trim().slice(0, 80);

const fingerprintQuery = (normalized: string): string =>
  crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12);

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

const buildAudit = (params: {
  normalized: string;
  matchedRules: string[];
  matchedRefusal: boolean;
  matchedEscalate: boolean;
  matchedClarify: boolean;
}): Audit => {
  const { normalized, matchedRules, matchedRefusal, matchedEscalate, matchedClarify } = params;

  return {
    audit_version: "audit.v1",
    query_fingerprint: fingerprintQuery(normalized),
    normalized_query_preview: previewNormalizedQuery(normalized),
    signals: {
      has_chest_pain: false,
      has_sweating: false,
      age_at_least_50: false,
      family_chest_pain: false,
      matched_refusal_keyword: matchedRefusal,
      matched_escalate_indicator: matchedEscalate,
      matched_clarify_indicator: matchedClarify,
    },
    matched_rules: matchedRules,
    decision_path: [...decisionPath],
  };
};

const buildFinanceResponse = (
  decision: GroundResponse["decision"],
  meta: GroundResponse["meta"],
  audit?: Audit,
): GroundResponse => ({
  cge_mode: true,
  decision,
  response: {
    clinical_summary:
      "Governance-only response: operational financial guidance is not provided.",
    what_is_known: [
      "The query relates to financial governance within the finance domain.",
    ],
    what_depends_on_context: [
      "Appropriate actions depend on verified financial data, user role, and jurisdiction.",
    ],
    what_is_uncertain: [
      "This system does not provide investment, trading, or tax advice.",
    ],
    when_to_escalate: [
      "When regulated activity or imminent financial harm is indicated, escalate to qualified review.",
    ],
  },
  meta,
  ...(audit ? { audit } : {}),
});

const matchRule = (normalized: string, keywords: string[]): boolean =>
  keywords.some((keyword) => normalized.includes(keyword));

export const groundFinance = (req: GroundRequest): GroundResponse => {
  const normalized = normalizeQuery(req.query);

  const matchedRules = financeSchema.rules.filter((rule) =>
    matchRule(normalized, rule.keywords),
  );

  const matchedRuleIds = matchedRules.map((rule) => rule.id);
  const matchedRefusal = matchedRules.some((rule) => rule.decision === "REFUSE");
  const matchedEscalate = matchedRules.some((rule) => rule.decision === "ESCALATE");
  const matchedClarify = matchedRules.some((rule) => rule.decision === "ASK_CLARIFY");

  let decision: GroundResponse["decision"] = "PROCEED";
  let meta: GroundResponse["meta"] = proceedMeta;

  if (matchedRefusal) {
    decision = "REFUSE";
    meta = refusalMeta;
  } else if (matchedEscalate) {
    decision = "ESCALATE";
    meta = escalateMeta;
  } else if (matchedClarify) {
    decision = "ASK_CLARIFY";
    meta = clarifyMeta;
  }

  const audit = req.debug
    ? buildAudit({
        normalized,
        matchedRules: matchedRuleIds,
        matchedRefusal,
        matchedEscalate,
        matchedClarify,
      })
    : undefined;

  return buildFinanceResponse(decision, meta, audit);
};
