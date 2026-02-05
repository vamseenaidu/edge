type Decision = {
  state: string;
  reason_code: string;
};

const stateStyles: Record<string, { bg: string; color: string }> = {
  PROCEED: { bg: "#e6f4ea", color: "#1e7a3b" },
  ESCALATE: { bg: "#fde8e8", color: "#b42318" },
  REFUSE: { bg: "#fef3c7", color: "#92400e" },
  ASK_CLARIFY: { bg: "#e0f2fe", color: "#0369a1" },
};

export function DecisionCard({ decision }: { decision: Decision }) {
  const style = stateStyles[decision.state] ?? { bg: "#f1f5f9", color: "#334155" };

  return (
    <section
      aria-label="Decision"
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        background: "var(--surface-1)",
        boxShadow: "var(--shadow-soft)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: style.bg,
            color: style.color,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {decision.state}
        </span>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Decision</h2>
      </div>
      <dl style={{ margin: 0, display: "grid", gap: "var(--space-1)" }}>
        <dt style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>Reason code</dt>
        <dd style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>{decision.reason_code}</dd>
      </dl>
    </section>
  );
}
