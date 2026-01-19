import { Router } from "express";
import { groundResponseSchema } from "./contract";
import { validateGroundRequest } from "./middleware";
import { ground } from "../core/engine";
import * as metrics from "../core/metrics";
import {
  RequestLogRecord,
  appendRequestLog,
  getRunId,
  makeQueryHash,
  makeQueryPreview,
} from "../utils/requestLog";

const router = Router();

router.post("/ground", validateGroundRequest, async (req, res) => {
  // Populated by validateGroundRequest middleware.
  const request = res.locals.groundRequest;

  if (!request) {
    return res.status(500).json({ error: "INTERNAL_CONTRACT_VIOLATION" });
  }

  const result = ground(request);

  // Fail-closed: if our internal engine ever violates the response contract,
  // do NOT leak partial/unstable output.
  const parsed = groundResponseSchema.safeParse(result);
  if (!parsed.success) {
    return res.status(500).json({ error: "INTERNAL_CONTRACT_VIOLATION" });
  }

  const debug = request.debug ?? false;

  const record: RequestLogRecord = {
    v: 1,
    run_id: getRunId(),
    ts: new Date().toISOString(),
    request: {
      domain: "medicine",
      debug,
      query_sha256: makeQueryHash(request.query),
      query_preview: makeQueryPreview(request.query),
    },
    decision: parsed.data.decision,
    meta: {
      cge_version: parsed.data.meta.cge_version,
      evidence_tiers_used: parsed.data.meta.evidence_tiers_used,
      uncertainty_level: parsed.data.meta.uncertainty_level,
      refusal_triggered: parsed.data.meta.refusal_triggered,
    },
    audit_included: parsed.data.audit !== undefined,
    audit_fingerprint:
      parsed.data.audit && "query_fingerprint" in parsed.data.audit
        ? (parsed.data.audit as { query_fingerprint?: string }).query_fingerprint ?? null
        : null,
  };

  try {
    await appendRequestLog(record);
  } catch (err) {
    console.error("CGE_LOG_APPEND_FAILED", err);
  }

  metrics.record(parsed.data.decision, { debug });

  return res.json(parsed.data);
});

router.get("/metrics", (_req, res) => {
  return res.json(metrics.snapshot());
});

// Debug audit example (not executed here):
// curl -X POST http://localhost:3000/v1/ground \\
//   -H "Content-Type: application/json" \\
//   -d '{"query":"Chest pain and sweating","domain":"medicine","debug":true}'

export default router;
