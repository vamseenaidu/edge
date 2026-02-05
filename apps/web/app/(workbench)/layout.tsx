import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "Runs", href: "/runs" },
  { label: "Policies", href: "/policies" },
];

export default function WorkbenchLayout({ children }: { children: ReactNode }) {
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
        <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>
          Auditor Mode
        </div>
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
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
            Navigation
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {navItems.map((item) => (
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
        </aside>

        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>{children}</section>
      </div>
    </div>
  );
}
