import type { JobRecord } from "./types";
import { completeJob, startJob } from "./store";
import { dequeue } from "./queue";

export type JobStore = {
  startJob: (id: string) => JobRecord | null;
  completeJob: (id: string, result: unknown) => JobRecord | null;
};

export type JobQueue = {
  dequeue: () => string | null;
};

export function processNextJob(deps: { store: JobStore; queue: JobQueue } = { store: { startJob, completeJob }, queue: { dequeue } }): JobRecord | null {
  const jobId = deps.queue.dequeue();
  if (!jobId) return null;

  const running = deps.store.startJob(jobId);
  if (!running) return null;

  return deps.store.completeJob(jobId, { accepted: true });
}
