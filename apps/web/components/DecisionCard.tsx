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
    <div
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
        <div style={{ fontSize: 16, fontWeight: 600 }}>Decision</div>
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>Reason code: {decision.reason_code}</div>
    </div>
  );
}
