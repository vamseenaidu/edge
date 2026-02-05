"use client";

import Link from "next/link";
import type { FocusEvent } from "react";
import { listPolicies } from "../../../lib/mockPolicies";
import { NotionTable } from "../../../components/NotionTable";
import { RoleGate } from "../../../components/RolePill";

export default function PoliciesPage() {
  const policies = listPolicies();
  const focusRing = {
    onFocus: (event: FocusEvent<HTMLElement>) => {
      event.currentTarget.style.boxShadow = "0 0 0 2px rgba(56, 189, 248, 0.35)";
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      event.currentTarget.style.boxShadow = "none";
    },
  };

  const rows = policies.map((policy) => ({
    id: policy.version,
    cells: [
      policy.version,
      policy.summary,
      <Link
        key={policy.version}
        href={`/policies/${policy.version}`}
        style={{ color: "var(--accent)", fontWeight: 600, outline: "none" }}
        {...focusRing}
      >
        View
      </Link>,
    ],
  }));
  const isEmpty = rows.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Policies</h1>
          <p style={{ margin: "var(--space-2) 0 0", color: "var(--text-secondary)" }}>
            Read-only policy versions available for audit review.
          </p>
        </div>
        <RoleGate allow={["policy_author", "platform_admin"]}>
          <Link
            href="/policies/edit"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-0)",
              fontWeight: 600,
              outline: "none",
            }}
            {...focusRing}
          >
            New Draft
          </Link>
        </RoleGate>
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
          No policy versions available yet.
        </div>
      ) : (
        <NotionTable columns={["Version", "Summary", "View"]} rows={rows} emptyLabel="No policy versions available" />
      )}
    </div>
  );
}
