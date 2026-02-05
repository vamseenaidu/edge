import Link from "next/link";
import { RoleGate } from "../../../../components/RolePill";
import { getPolicy, listPolicies } from "../../../../lib/mockPolicies";

export function generateStaticParams() {
  return listPolicies().map((policy) => ({ version: policy.version }));
}

export default function PolicyDetailPage({ params }: { params: { version: string } }) {
  const policy = getPolicy(params.version);

  if (!policy) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }} role="status">
        <style>{`
          .focus-ring:focus-visible {
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35);
            border-radius: 6px;
          }
        `}</style>
        <h1 style={{ margin: 0 }}>Policy not found</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          The requested policy version is not available in this session.
        </p>
        <Link href="/policies" className="focus-ring" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Back to policies
        </Link>
      </div>
    );
  }

  const comparisons = listPolicies().filter((item) => item.version !== policy.version);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <style>{`
        .focus-ring:focus-visible {
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35);
          border-radius: 6px;
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>Policy</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <h1 style={{ margin: 0 }}>{policy.version}</h1>
          <RoleGate allow={["policy_author", "platform_admin"]}>
            <Link
              href={`/policies/edit?base=${encodeURIComponent(policy.version)}`}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-0)",
                fontWeight: 600,
              }}
              className="focus-ring"
            >
              Create Draft
            </Link>
          </RoleGate>
        </div>
        <div style={{ color: "var(--text-secondary)" }}>{policy.summary}</div>
      </div>

      <form
        action="/policies/diff"
        method="get"
        aria-label="Compare policy versions"
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
        <input type="hidden" name="from" value={policy.version} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Compare to
            <select
              name="to"
              aria-label="Compare to policy version"
              defaultValue={comparisons[0]?.version ?? ""}
              style={{
                marginLeft: "var(--space-2)",
                padding: "6px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-0)",
              }}
            >
              {comparisons.map((other) => (
                <option key={other.version} value={other.version}>
                  {other.version}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-0)",
              fontWeight: 600,
              cursor: "pointer",
            }}
            className="focus-ring"
            disabled={comparisons.length === 0}
          >
            Compare
          </button>
        </div>
      </form>

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
            whiteSpace: "pre",
            overflowX: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
            fontSize: 13,
            color: "var(--text-secondary)",
            maxHeight: 420,
          }}
        >
          {policy.text}
        </pre>
      </div>
    </div>
  );
}
