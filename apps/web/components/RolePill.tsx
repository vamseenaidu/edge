"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getRole, setRole, type EdgeRole } from "../lib/rbac";

const roleOptions: EdgeRole[] = ["auditor", "policy_author", "platform_admin", "operator"];

export function RolePill() {
  const [role, setRoleState] = useState<EdgeRole>("auditor");

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  const handleChange = (nextRole: EdgeRole) => {
    setRole(nextRole);
    setRoleState(nextRole);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      {role === "auditor" && (
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid var(--border-subtle)",
            fontSize: 11,
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Read-only
        </span>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
        Role
        <select
          value={role}
          onChange={(event) => handleChange(event.target.value as EdgeRole)}
          style={{
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            background: "var(--surface-0)",
            fontSize: 12,
          }}
        >
          {roleOptions.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

type RoleGateProps = {
  allow: EdgeRole[];
  children: ReactNode;
};

export function RoleGate({ allow, children }: RoleGateProps) {
  const [role, setRoleState] = useState<EdgeRole>("auditor");

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  if (!allow.includes(role)) return null;

  return <>{children}</>;
}

export function RoleNav() {
  const [role, setRoleState] = useState<EdgeRole>("auditor");

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  const items = [
    { label: "Runs", href: "/runs", allow: ["auditor", "policy_author", "platform_admin", "operator"] },
    { label: "Policies", href: "/policies", allow: ["auditor", "policy_author", "platform_admin"] },
  ];

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {items
        .filter((item) => item.allow.includes(role))
        .map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            {item.label}
          </Link>
        ))}
    </nav>
  );
}
