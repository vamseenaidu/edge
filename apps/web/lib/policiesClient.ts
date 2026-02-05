"use client";

import { apiGet, apiPost } from "./apiClient";

export type PolicySummary = { version: string; summary: string };
export type PolicyRecord = {
  version: string;
  summary: string;
  text: string;
  domain?: string;
  status?: string;
};

export type PolicyDraftInput = {
  version: string;
  domain: string;
  summary: string;
  text: string;
};

export type ClientResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

function messageFrom(body: any): string {
  if (!body) return "Request failed";
  if (typeof body === "string") return body;
  return body?.error?.message || body?.message || "Request failed";
}

export async function listPolicies(): Promise<ClientResult<PolicySummary[]>> {
  const res = await apiGet("/api/v1/policies");
  if (res.ok && res.body?.kind === "edge.ok") {
    const policies = res.body?.data?.policies ?? [];
    return { ok: true, status: res.status, data: policies };
  }
  return { ok: false, status: res.status, data: [], error: messageFrom(res.body) };
}

export async function getPolicy(version: string): Promise<ClientResult<PolicyRecord>> {
  const res = await apiGet(`/api/v1/policies/${encodeURIComponent(version)}`);
  if (res.ok && res.body?.kind === "edge.ok") {
    return { ok: true, status: res.status, data: res.body?.data?.policy ?? null };
  }
  return { ok: false, status: res.status, data: null, error: messageFrom(res.body) };
}

export async function submitDraft(input: PolicyDraftInput): Promise<ClientResult<PolicyRecord>> {
  const res = await apiPost("/api/v1/policies/draft", input);
  if (res.ok && res.body?.kind === "edge.ok") {
    return { ok: true, status: res.status, data: res.body?.data?.policy ?? null };
  }
  return { ok: false, status: res.status, data: null, error: messageFrom(res.body) };
}

export async function publish(version: string): Promise<ClientResult<PolicyRecord>> {
  const res = await apiPost(`/api/v1/policies/${encodeURIComponent(version)}/publish`, {});
  if (res.ok && res.body?.kind === "edge.ok") {
    return { ok: true, status: res.status, data: res.body?.data?.policy ?? null };
  }
  return { ok: false, status: res.status, data: null, error: messageFrom(res.body) };
}

export async function getActive(domain: string): Promise<ClientResult<PolicyRecord | null>> {
  const res = await apiGet(`/api/v1/policies/active/${encodeURIComponent(domain)}`);
  if (res.ok && res.body?.kind === "edge.ok") {
    return { ok: true, status: res.status, data: res.body?.data?.policy ?? null };
  }
  return { ok: false, status: res.status, data: null, error: messageFrom(res.body) };
}
