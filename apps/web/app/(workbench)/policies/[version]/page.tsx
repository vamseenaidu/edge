import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicy, listPolicies } from "../../../../lib/mockPolicies";

export const dynamicParams = false;

export function generateStaticParams() {
  return listPolicies().map((policy) => ({ version: policy.version }));
}

export default function PolicyDetailPage({ params }: { params: { version: string } }) {
  const policy = getPolicy(params.version);
  if (!policy) return notFound();

  const comparisons = listPolicies().filter((item) => item.version !== policy.version);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>Policy</div>
        <h1 style={{ margin: 0 }}>{policy.version}</h1>
        <div style={{ color: "var(--text-secondary)" }}>{policy.summary}</div>
        {policy.published_at ? (
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Published: {policy.published_at}</div>
        ) : null}
      </div>

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
        <div style={{ fontSize: 14, fontWeight: 600 }}>Compare</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {comparisons.length === 0 ? (
            <span style={{ color: "var(--text-muted)" }}>No other versions available.</span>
          ) : (
            comparisons.map((other) => (
              <Link
                key={other.version}
                href={`/policies/diff?from=${policy.version}&to=${other.version}`}
                style={{
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Compare to {other.version}
              </Link>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          background: "var(--surface-1)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: "var(--space-2)" }}>Policy Text</div>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          {policy.text}
        </pre>
      </div>
    </div>
  );
}
