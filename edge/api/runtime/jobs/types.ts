export type JobStatus = "queued" | "running" | "completed" | "failed";
export type JobKind = "eval_run";

export type JobRecord = {
  id: string;
  kind: JobKind;
  status: JobStatus;
  payload?: unknown;
  created_at_ms?: number;
  result?: unknown;
  error?: { message: string };
  tenant_id?: string | null;
  actor_id?: string | null;
  idempotency_key?: string | null;
};
