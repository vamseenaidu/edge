"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "./apiClient";
import { DecisionCard } from "../components/DecisionCard";
import { TraceViewer } from "../components/TraceViewer";

export type JobRecord = {
  id: string;
  kind: string;
  status: string;
  result?: any;
  error?: { message?: string } | null;
  tenant_id?: string | null;
  actor_id?: string | null;
  idempotency_key?: string | null;
};

export type ClientResult<T> = {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
};

export type RunSummary = JobRecord;

function messageFrom(body: any): string {
  if (!body) return "Request failed";
  if (typeof body === "string") return body;
  return body?.error?.message || body?.message || "Request failed";
}

export async function listRuns(): Promise<ClientResult<RunSummary[]>> {
  const res = await apiGet("/api/v1/jobs?limit=50");
  if (res.ok && res.body?.kind === "edge.ok") {
    const jobs = Array.isArray(res.body?.data?.jobs) ? res.body.data.jobs : [];
    return { ok: true, status: res.status, data: jobs };
  }
  const error = res.status === 404 ? "Jobs list endpoint is not available." : messageFrom(res.body);
  return { ok: false, status: res.status, data: [], error };
}

export async function getRun(id: string): Promise<ClientResult<JobRecord | null>> {
  const res = await apiGet(`/api/v1/jobs/${encodeURIComponent(id)}`);
  if (res.ok && res.body?.kind === "edge.ok") {
    const job = res.body?.data?.job ?? res.body?.data ?? null;
    return { ok: true, status: res.status, data: job };
  }
  return { ok: false, status: res.status, data: null, error: messageFrom(res.body) };
}

export async function replayRun(id: string): Promise<ClientResult<any>> {
  const res = await apiGet(`/api/v1/jobs/${encodeURIComponent(id)}/replay`);
  if (res.ok && res.body?.kind === "edge.ok") {
    const replay = res.body?.data?.replay ?? res.body?.data ?? null;
    return { ok: true, status: res.status, data: replay };
  }
  return { ok: false, status: res.status, data: null, error: messageFrom(res.body) };
}

type RunDetailClientProps = {
  runId: string;
};

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-4)",
  background: "var(--surface-1)",
  boxShadow: "var(--shadow-soft)",
};

export function RunDetailClient({ runId }: RunDetailClientProps) {
  const [run, setRun] = useState<JobRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replayState, setReplayState] = useState<{ loading: boolean; error: string | null; data: any | null }>({
    loading: false,
    error: null,
    data: null,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getRun(runId).then((res) => {
      if (!active) return;
      setRun(res.data ?? null);
      setError(res.ok ? null : res.error ?? "Unable to load run.");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [runId]);

  const decision = useMemo(() => {
    const candidate = run?.result?.decision ?? run?.result?.decision_result ?? null;
    if (candidate && typeof candidate === "object" && "state" in candidate && "reason_code" in candidate) {
      return candidate as { state: string; reason_code: string };
    }
    return null;
  }, [run]);

  const matchedRules = useMemo(() => {
    return (run?.result?.matched_rules ?? (run as any)?.matched_rules ?? []) as string[];
  }, [run]);

  const toolAudit = useMemo(() => {
    return (run?.result?.tool_audit ?? (run as any)?.tool_audit ?? []) as any[];
  }, [run]);

  const handleReplay = async () => {
    setReplayState({ loading: true, error: null, data: null });
    const res = await replayRun(runId);
    if (res.ok) {
      setReplayState({ loading: false, error: null, data: res.data });
    } else {
      setReplayState({ loading: false, error: res.error ?? "Replay failed.", data: null });
    }
  };

  if (loading) {
    return React.createElement("div", { style: { color: "var(--text-secondary)" } }, "Loading run…");
  }

  if (!run) {
    return React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "var(--space-3)" }, role: "status" },
      React.createElement("h1", { style: { margin: 0 } }, "Run not found"),
      React.createElement(
        "p",
        { style: { margin: 0, color: "var(--text-secondary)" } },
        error ?? "The requested run could not be located."
      ),
      React.createElement(Link, { href: "/runs", style: { color: "var(--accent)", fontWeight: 600 } }, "Back to runs")
    );
  }

  const canReplay = run.status === "completed";

  return React.createElement(
    "div",
    { style: containerStyle },
    React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
      React.createElement("div", { style: { fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" } }, "Run"),
      React.createElement("h1", { style: { margin: 0 } }, run.id),
      React.createElement(
        "div",
        { style: { color: "var(--text-secondary)" } },
        `Status: ${run.status} · Kind: ${run.kind || "—"}`
      )
    ),
    decision
      ? React.createElement(DecisionCard, { decision })
      : React.createElement(
          "div",
          { style: { ...cardStyle, color: "var(--text-secondary)" } },
          "Decision details are not available for this run yet."
        ),
    React.createElement(TraceViewer, { matchedRules, toolAudit }),
    React.createElement(
      "div",
      {
        style: {
          ...cardStyle,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        },
      },
      React.createElement("div", { style: { fontSize: 14, fontWeight: 600 } }, "Job Record"),
      React.createElement(
        "div",
        { style: { fontSize: 13, color: "var(--text-secondary)" } },
        `Tenant: ${run.tenant_id ?? "—"} · Actor: ${run.actor_id ?? "—"}`
      ),
      React.createElement(
        "pre",
        {
          style: {
            margin: 0,
            whiteSpace: "pre-wrap",
            overflowX: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
            fontSize: 12,
            color: "var(--text-secondary)",
          },
        },
        JSON.stringify({ result: run.result ?? null, error: run.error ?? null }, null, 2)
      )
    ),
    React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
      React.createElement(
        "button",
        {
          type: "button",
          onClick: handleReplay,
          disabled: !canReplay || replayState.loading,
          style: {
            alignSelf: "flex-start",
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            background: "var(--surface-0)",
            fontWeight: 600,
            cursor: canReplay ? "pointer" : "not-allowed",
            opacity: canReplay ? 1 : 0.6,
          },
        },
        replayState.loading ? "Replaying…" : "Replay"
      ),
      replayState.error
        ? React.createElement("div", { style: { color: "var(--text-secondary)" } }, replayState.error)
        : null,
      replayState.data
        ? React.createElement(
            "pre",
            {
              style: {
                margin: 0,
                whiteSpace: "pre-wrap",
                overflowX: "auto",
                fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
                fontSize: 12,
                color: "var(--text-secondary)",
              },
            },
            JSON.stringify(replayState.data, null, 2)
          )
        : null
    )
  );
}
