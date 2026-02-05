import { err, ok, sendJson } from "../envelope";
import { loadAuthConfig } from "../config/auth";
import { createJob, createOrGetJob, getJob } from "../runtime/jobs/store";
import { enqueue } from "../runtime/jobs/queue";
import { toJobPublic } from "../runtime/jobs/envelope";

export function mountJobRoutes(router: { get: (path: string, handler: any) => void; post: (path: string, handler: any) => void }): void {
  router.post("/jobs", (req: any, res: any) => {
    const body = req?.body as { kind?: string; payload?: unknown; idempotency_key?: string } | undefined;
    if (!body || body.kind !== "eval_run") {
      sendJson(res, err("BAD_REQUEST", "Invalid job request"), 400);
      return;
    }

    const tenant_id = req?.edge_tenant_id ?? null;
    const authEnabled = loadAuthConfig().enabled;
    const actor_id = authEnabled ? req?.edge_actor?.actor_id ?? null : null;

    const job = body.idempotency_key
      ? createOrGetJob({ kind: "eval_run", payload: body.payload, tenant_id, actor_id, idempotency_key: body.idempotency_key })
      : createJob({ kind: "eval_run", payload: body.payload, tenant_id, actor_id });

    if (job.status === "queued") {
      enqueue(job.id);
    }

    sendJson(res, ok({ job_id: job.id, status: job.status }), 200);
  });

  router.get("/jobs/:id", (req: any, res: any) => {
    const job = getJob(req.params.id);
    if (!job) {
      sendJson(res, err("NOT_FOUND", "Job not found"), 404);
      return;
    }
    sendJson(res, ok({ job: toJobPublic(job) }), 200);
  });

  router.get("/jobs/:id/replay", (req: any, res: any) => {
    const job = getJob(req.params.id);
    if (!job) {
      sendJson(res, err("NOT_FOUND", "Job not found"), 404);
      return;
    }
    if (job.status !== "completed") {
      sendJson(res, err("BAD_REQUEST", "Job not completed"), 409);
      return;
    }
    sendJson(res, ok({ replay: { job_id: job.id, kind: job.kind, result: job.result ?? null } }), 200);
  });
}
