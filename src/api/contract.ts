import { z } from "zod";

export const auditSchema = z
  .object({
    audit_version: z.literal("audit.v1"),
    query_fingerprint: z.string().length(12),
    normalized_query_preview: z.string().max(80),
    signals: z.object({
      has_chest_pain: z.boolean(),
      has_sweating: z.boolean(),
      age_at_least_50: z.boolean(),
      family_chest_pain: z.boolean(),
      matched_refusal_keyword: z.boolean(),
      matched_escalate_indicator: z.boolean(),
      matched_clarify_indicator: z.boolean(),
    }),
    matched_rules: z.array(z.string()),
    decision_path: z.array(z.string()),
  })
  .strict();

export const groundRequestSchema = z.object({
  query: z.string().min(1, "query must be a non-empty string"),
  domain: z.literal("medicine"),
  debug: z.boolean().optional().default(false),
});

export const groundResponseSchema = z.object({
  cge_mode: z.boolean(),
  decision: z.union([
    z.literal("PROCEED"),
    z.literal("ASK_CLARIFY"),
    z.literal("REFUSE"),
    z.literal("ESCALATE"),
  ]),
  response: z.object({
    clinical_summary: z.string(),
    what_is_known: z.array(z.string()),
    what_depends_on_context: z.array(z.string()),
    what_is_uncertain: z.array(z.string()),
    when_to_escalate: z.array(z.string()),
  }),
  meta: z.object({
    cge_version: z.literal("v1.0"),
    evidence_tiers_used: z.array(
      z.union([
        z.literal("A"),
        z.literal("B"),
        z.literal("C"),
        z.literal("D"),
      ])
    ),
    uncertainty_level: z.union([
      z.literal("LOW"),
      z.literal("MODERATE"),
      z.literal("HIGH"),
    ]),
    refusal_triggered: z.boolean(),
  }),
  audit: auditSchema.optional(),
});

export type GroundRequest = z.infer<typeof groundRequestSchema>;
export type GroundResponse = z.infer<typeof groundResponseSchema>;
export type Audit = z.infer<typeof auditSchema>;
