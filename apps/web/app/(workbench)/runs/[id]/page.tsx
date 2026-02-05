import { notFound } from "next/navigation";
import { DecisionCard } from "../../../../components/DecisionCard";
import { TraceViewer } from "../../../../components/TraceViewer";
import { getRun, listRuns } from "../../../../lib/mockRuns";

export const dynamicParams = false;

export function generateStaticParams() {
  return listRuns().map((run) => ({ id: run.id }));
}

export default function RunDetailPage({ params }: { params: { id: string } }) {
  const run = getRun(params.id);
  if (!run) return notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>Run</div>
        <h1 style={{ margin: 0 }}>{run.id}</h1>
        <div style={{ color: "var(--text-secondary)" }}>
          Domain: {run.domain} · Policy: {run.policy_version}
        </div>
      </div>

      <DecisionCard decision={run.decision} />
      <TraceViewer matchedRules={run.matched_rules} toolAudit={run.tool_audit ?? []} />
    </div>
  );
}
