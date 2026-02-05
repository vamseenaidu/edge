import { err, ok, sendJson } from "../envelope";
import { createJob, getJob, setJobStatus } from "../runtime/jobs/store";

export function mountJobRoutes(router: { get: (path: string, handler: any) => void; post: (path: string, handler: any) => void }): void {
  router.post("/jobs", (req: any, res: any) => {
    const body = req?.body as { kind?: string; payload?: unknown } | undefined;
    if (!body || body.kind !== "eval_run") {
      sendJson(res, err("BAD_REQUEST", "Invalid job request"), 400);
      return;
    }

    const tenant_id = req?.edge_tenant_id ?? null;
    const actor_id = req?.edge_actor?.actor_id ?? null;

    const job = createJob({ kind: "eval_run", tenant_id, actor_id });
    const completed = setJobStatus(job.id, "completed", { accepted: true });

    sendJson(res, ok({ job_id: job.id, status: completed?.status ?? job.status }), 200);
  });

  router.get("/jobs/:id", (req: any, res: any) => {
    const job = getJob(req.params.id);
    if (!job) {
      sendJson(res, err("NOT_FOUND", "Job not found"), 404);
      return;
    }
    sendJson(res, ok({ job }), 200);
  });
}
