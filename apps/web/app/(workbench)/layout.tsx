"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getRole, type EdgeRole } from "../../lib/rbac";
import { RolePill } from "../../components/RolePill";

const navItems = [
  { label: "Runs", href: "/runs", allow: ["auditor", "policy_author", "platform_admin", "operator"] as EdgeRole[] },
  { label: "Policies", href: "/policies", allow: ["auditor", "policy_author", "platform_admin"] as EdgeRole[] },
];

export default function WorkbenchLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const role = getRole();
  const visibleNav = navItems.filter((item) => item.allow.includes(role));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-3) 0",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600 }}>EDGE Workbench</div>
        <RolePill />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: "var(--space-6)",
          alignItems: "start",
        }}
      >
        <aside
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            background: "var(--surface-1)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "var(--space-3)",
            }}
          >
            Navigation
          </div>
          <nav
            aria-label="Primary"
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}
          >
            {visibleNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    background: isActive ? "var(--surface-0)" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                    outline: "none",
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.boxShadow = "0 0 0 2px rgba(56, 189, 248, 0.35)";
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>{children}</section>
      </div>
    </div>
  );
}
