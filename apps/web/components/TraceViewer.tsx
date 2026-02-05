import { NotionTable } from "./NotionTable";

type ToolAuditEvent = {
  tool_name: string;
  rule_decision: "deny" | "allow" | "conditional";
  allowed: boolean;
  reason_code: string;
  required_preconditions?: string[];
  preconditions_met?: boolean;
  required_postconditions?: string[];
  postconditions_met?: boolean;
  attribution?: { actor_id: string | null; tenant_id: string | null; role: string | null };
};

type TraceViewerProps = {
  matchedRules: string[];
  toolAudit: ToolAuditEvent[];
};

const formatList = (items?: string[]) => (items && items.length > 0 ? items.join(", ") : "—");

const formatMet = (value: boolean | undefined) => {
  if (value === undefined) return "—";
  return value ? "met" : "missing";
};

const formatAttribution = (attr?: { actor_id: string | null; tenant_id: string | null; role: string | null }) => {
  if (!attr) return "—";
  return `actor:${attr.actor_id ?? "—"} tenant:${attr.tenant_id ?? "—"} role:${attr.role ?? "—"}`;
};

export function TraceViewer({ matchedRules, toolAudit }: TraceViewerProps) {
  const toolRows = toolAudit.map((event) => ({
    id: `${event.tool_name}-${event.reason_code}`,
    cells: [
      event.tool_name,
      event.rule_decision,
      event.allowed ? "yes" : "no",
      event.reason_code,
      `${formatList(event.required_preconditions)} (${formatMet(event.preconditions_met)})`,
      `${formatList(event.required_postconditions)} (${formatMet(event.postconditions_met)})`,
      formatAttribution(event.attribution),
    ],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          background: "var(--surface-1)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: "var(--space-2)" }}>Matched Rules</div>
        {matchedRules.length === 0 ? (
          <div style={{ color: "var(--text-muted)" }}>No matched rules.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "var(--space-4)", color: "var(--text-secondary)" }}>
            {matchedRules.map((rule) => (
              <li key={rule} style={{ marginBottom: "var(--space-1)" }}>
                {rule}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Tool Audit Events</div>
        <NotionTable
          columns={[
            "Tool",
            "Rule",
            "Allowed",
            "Reason",
            "Preconditions",
            "Postconditions",
            "Attribution",
          ]}
          rows={toolRows}
          emptyLabel="No tool audit events"
        />
      </div>
    </div>
  );
}
