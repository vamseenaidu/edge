"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listRuns, type RunSummary } from "../../../lib/runsClient";
import { NotionTable } from "../../../components/NotionTable";

export default function RunsPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listRuns().then((res) => {
      if (!active) return;
      setRuns(res.data ?? []);
      setError(res.ok ? null : res.error ?? "Unable to load runs.");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(
    () =>
      runs.map((run) => ({
        id: run.id,
        cells: [
          <Link
            key={run.id}
            href={`/runs/${run.id}`}
            className="focus-ring"
            style={{ color: "var(--accent)", fontWeight: 600 }}
          >
            {run.id}
          </Link>,
          run?.result?.decision?.state ?? run.status ?? "—",
          (run as any).domain ?? "—",
          (run as any).policy_version ?? "—",
          (run as any).timestamp ?? "—",
        ],
      })),
    [runs]
  );

  const isEmpty = !loading && rows.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <style>{`
        .focus-ring:focus-visible {
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35);
          border-radius: 6px;
        }
      `}</style>
      <div>
        <h1 style={{ margin: 0 }}>Runs</h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-secondary)" }}>
          Read-only audit runs. Select a run to view its decision trace.
        </p>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-secondary)" }}>Loading runs…</div>
      ) : error ? (
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            background: "var(--surface-1)",
            boxShadow: "var(--shadow-soft)",
            color: "var(--text-secondary)",
          }}
        >
          {error}
          <div style={{ marginTop: "var(--space-2)" }}>
            Create a job via <code>POST /api/v1/jobs</code> to see runs here.
          </div>
        </div>
      ) : isEmpty ? (
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            background: "var(--surface-1)",
            boxShadow: "var(--shadow-soft)",
            color: "var(--text-secondary)",
          }}
        >
          No runs available yet.
          <div style={{ marginTop: "var(--space-2)" }}>
            Create a job via <code>POST /api/v1/jobs</code> to see runs here.
          </div>
        </div>
      ) : (
        <NotionTable
          columns={["Run ID", "Decision", "Domain", "Policy Version", "Timestamp"]}
          rows={rows}
          emptyLabel="No runs available"
        />
      )}
    </div>
  );
}
