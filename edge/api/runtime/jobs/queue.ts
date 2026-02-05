const queue: string[] = [];

export function enqueue(jobId: string): void {
  queue.push(jobId);
}

export function dequeue(): string | null {
  return queue.length > 0 ? queue.shift() ?? null : null;
}

export function size(): number {
  return queue.length;
}

export function clear(): void {
  queue.length = 0;
}
