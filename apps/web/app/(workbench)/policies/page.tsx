"use client";

import Link from "next/link";
import { listPolicies } from "../../../lib/mockPolicies";
import { NotionTable } from "../../../components/NotionTable";

export default function PoliciesPage() {
  const policies = listPolicies();

  const rows = policies.map((policy) => ({
    id: policy.version,
    cells: [
      policy.version,
      policy.summary,
      <Link key={policy.version} href={`/policies/${policy.version}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
        View
      </Link>,
    ],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Policies</h1>
          <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-secondary)" }}>
            Read-only policy versions available for audit review.
          </p>
        </div>
        <Link
          href="/policies/edit"
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            background: "var(--surface-0)",
            fontWeight: 600,
          }}
        >
          New Draft
        </Link>
      </div>

      <NotionTable columns={["Version", "Summary", "View"]} rows={rows} emptyLabel="No policy versions available" />
    </div>
  );
}
