import Link from "next/link";
import { listRuns } from "../../../lib/mockRuns";
import { NotionTable } from "../../../components/NotionTable";

export default function RunsPage() {
  const runs = listRuns();
  const rows = runs.map((run) => ({
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
      run.decision.state,
      run.domain,
      run.policy_version,
      run.timestamp ?? "—",
    ],
  }));

  const isEmpty = rows.length === 0;

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

      {isEmpty ? (
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
