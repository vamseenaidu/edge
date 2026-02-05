import Link from "next/link";
import { listPolicies } from "../../../lib/mockPolicies";
import { NotionTable } from "../../../components/NotionTable";

export default function PoliciesPage() {
  const policies = listPolicies();

  const rows = policies.map((policy) => ({
    id: policy.version,
    cells: [
      policy.version,
      policy.published_at ?? "—",
      policy.summary,
      <Link key={policy.version} href={`/policies/${policy.version}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
        View
      </Link>,
    ],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <h1 style={{ margin: 0 }}>Policies</h1>
        <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-secondary)" }}>
          Read-only policy versions available for audit review.
        </p>
      </div>

      <NotionTable
        columns={["Version", "Published At", "Summary", "View"]}
        rows={rows}
        emptyLabel="No policy versions available"
      />
    </div>
  );
}
