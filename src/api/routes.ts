import { Router } from "express";
import { groundResponseSchema } from "./contract";
import { validateGroundRequest } from "./middleware";
import { getVignettes } from "./vignettes";
import { latestReportRelativePath, readLatestReport } from "./reports";
import { groundByDomain } from "../core/domainRouter";
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

  const result = groundByDomain(request);

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
      domain: request.domain,
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

router.get("/vignettes", async (_req, res) => {
  try {
    const vignettes = await getVignettes();
    return res.json(vignettes);
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name ?? "";
    if (name === "VIGNETTES_NOT_FOUND") {
      return res.status(500).json({ ok: false, error: "VIGNETTES_NOT_FOUND" });
    }
    return res.status(500).json({ ok: false, error: "VIGNETTES_UNAVAILABLE" });
  }
});

router.get("/reports/latest", async (_req, res) => {
  try {
    const latest = await readLatestReport();
    return res.status(200).json(latest);
  } catch (err) {
    console.error("REPORTS_LATEST_FAILED", err);
    return res.status(500).json({ ok: false, error: "REPORT_UNAVAILABLE" });
  }
});

router.get("/reports/latest.json", async (_req, res) => {
  try {
    const latest = await readLatestReport();
    if (!latest.ok || !latest.report) {
      return res.status(404).json({ ok: false, error: "REPORT_NOT_FOUND" });
    }
    return res.json(latest.report);
  } catch (err) {
    console.error("REPORTS_LATEST_JSON_FAILED", err);
    return res.status(500).json({
      ok: false,
      error: "REPORT_UNAVAILABLE",
      path: latestReportRelativePath,
    });
  }
});

// Debug audit example (not executed here):
// curl -X POST http://localhost:3000/v1/ground \\
//   -H "Content-Type: application/json" \\
//   -d '{"query":"Chest pain and sweating","domain":"medicine","debug":true}'

export default router;
