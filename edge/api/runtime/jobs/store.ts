import { randomBytes, randomUUID } from "node:crypto";
import type { JobKind, JobRecord, JobStatus } from "./types";

const jobs = new Map<string, JobRecord>();

const createJobId = (): string => {
  if (typeof randomUUID === "function") {
    return randomUUID();
  }
  return randomBytes(16).toString("hex");
};

type CreateJobInput = {
  kind: JobKind;
  tenant_id?: string | null;
  actor_id?: string | null;
};

export function createJob(input: CreateJobInput): JobRecord {
  const id = createJobId();
  const record: JobRecord = {
    id,
    kind: input.kind,
    status: "queued",
    tenant_id: input.tenant_id ?? null,
    actor_id: input.actor_id ?? null,
  };
  jobs.set(id, record);
  return record;
}

export function getJob(id: string): JobRecord | null {
  return jobs.get(id) ?? null;
}

const canStart = (status: JobStatus): boolean => status === "queued";
const canComplete = (status: JobStatus): boolean => status === "running" || status === "queued";
const canFail = (status: JobStatus): boolean => status === "running" || status === "queued";

export function startJob(id: string): JobRecord | null {
  const current = jobs.get(id);
  if (!current || !canStart(current.status)) return null;
  const updated: JobRecord = { ...current, status: "running" };
  jobs.set(id, updated);
  return updated;
}

export function completeJob(id: string, result: unknown): JobRecord | null {
  const current = jobs.get(id);
  if (!current || !canComplete(current.status)) return null;
  const updated: JobRecord = { ...current, status: "completed", result };
  delete (updated as { error?: unknown }).error;
  jobs.set(id, updated);
  return updated;
}

export function failJob(id: string, message: string): JobRecord | null {
  const current = jobs.get(id);
  if (!current || !canFail(current.status)) return null;
  const updated: JobRecord = { ...current, status: "failed", error: { message } };
  delete (updated as { result?: unknown }).result;
  jobs.set(id, updated);
  return updated;
}

export function setJobStatus(
  id: string,
  status: JobStatus,
  result?: unknown,
  error?: { message: string },
): JobRecord | null {
  const current = jobs.get(id);
  if (!current) return null;
  const updated: JobRecord = {
    ...current,
    status,
    ...(result !== undefined ? { result } : {}),
    ...(error ? { error } : {}),
  };
  jobs.set(id, updated);
  return updated;
}

export function listJobs(limit = 50): JobRecord[] {
  const items = Array.from(jobs.values());
  return items.slice(0, Math.max(0, limit));
}
