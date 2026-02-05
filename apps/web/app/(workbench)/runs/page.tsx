import Link from "next/link";
import { listRuns } from "../../../lib/mockRuns";
import { NotionTable } from "../../../components/NotionTable";

export default function RunsPage() {
  const runs = listRuns();

  const rows = runs.map((run) => ({
    id: run.id,
    cells: [
      <Link key={run.id} href={`/runs/${run.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
        {run.id}
      </Link>,
      run.decision.state,
      run.domain,
      run.policy_version,
      run.timestamp ?? "—",
    ],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <h1 style={{ margin: 0 }}>Runs</h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-secondary)" }}>
          Read-only audit runs. Select a run to view its decision trace.
        </p>
      </div>

      <NotionTable
        columns={["Run ID", "Decision", "Domain", "Policy Version", "Timestamp"]}
        rows={rows}
        emptyLabel="No runs available"
      />
    </div>
  );
}
