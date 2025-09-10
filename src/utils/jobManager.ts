// src/utils/jobManager.ts
// In-memory job manager for async tasks, using requestId as the key

export type JobStatus = 'processing' | 'done' | 'error';

export interface JobResult {
  status: JobStatus;
  result?: unknown;
  error?: string;
}

const jobs: Record<string, JobResult> = {};

export function createJob(requestId: string) {
  jobs[requestId] = { status: 'processing' };
}

export function setJobResult(requestId: string, result: unknown) {
  jobs[requestId] = { status: 'done', result };
}

export function setJobError(requestId: string, error: string) {
  jobs[requestId] = { status: 'error', error };
}

export function getJob(requestId: string): JobResult | undefined {
  return jobs[requestId];
}
