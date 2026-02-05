import type { ReactNode } from "react";
import { RoleNav, RolePill } from "../../components/RolePill";

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
          <RoleNav />
        </aside>

        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>{children}</section>
      </div>
    </div>
  );
}
