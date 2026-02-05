import type { JobRecord } from "./types";

export function toJobPublic(job: JobRecord): Record<string, unknown> {
  const output: Record<string, unknown> = {
    id: job.id,
    kind: job.kind,
    status: job.status,
    tenant_id: job.tenant_id ?? null,
    actor_id: job.actor_id ?? null,
  };

  if (job.idempotency_key !== undefined && job.idempotency_key !== null) {
    output.idempotency_key = job.idempotency_key;
  }

  if (job.status === "completed") {
    output.result = job.result ?? null;
  }

  if (job.status === "failed") {
    output.error = job.error ?? { message: "Unknown error" };
  }

  return output;
}
