"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { getPolicy, listPolicies, type MockPolicy } from "../lib/mockPolicies";

type InlineStatusProps = {
  tone: "ok" | "fail" | "draft";
  label: string;
};

const toneStyles: Record<InlineStatusProps["tone"], CSSProperties> = {
  ok: {
    background: "rgba(22, 163, 74, 0.12)",
    borderColor: "rgba(22, 163, 74, 0.4)",
    color: "var(--text-primary)",
  },
  fail: {
    background: "rgba(220, 38, 38, 0.12)",
    borderColor: "rgba(220, 38, 38, 0.4)",
    color: "var(--text-primary)",
  },
  draft: {
    background: "var(--surface-0)",
    borderColor: "var(--border-subtle)",
    color: "var(--text-secondary)",
  },
};

export function InlineStatus({ tone, label }: InlineStatusProps) {
  return (
    <span
      style={{
        ...toneStyles[tone],
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

type PolicyDetailClientProps = {
  version: string;
  initialPolicy: MockPolicy | null;
};

export function PolicyDetailClient({ version, initialPolicy }: PolicyDetailClientProps) {
  const policies = listPolicies();
  const policy = getPolicy(version) ?? initialPolicy;

  if (!policy) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h1 style={{ margin: 0 }}>Policy not found</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          The requested policy version is not available in this session.
        </p>
        <Link href="/policies" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Back to policies
        </Link>
      </div>
    );
  }

  const comparisons = policies.filter((item) => item.version !== policy.version);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>Policy</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <h1 style={{ margin: 0 }}>{policy.version}</h1>
          <Link
            href={`/policies/edit?base=${encodeURIComponent(policy.version)}`}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-0)",
              fontWeight: 600,
            }}
          >
            Create Draft
          </Link>
        </div>
        <div style={{ color: "var(--text-secondary)" }}>{policy.summary}</div>
      </div>

      <form
        action="/policies/diff"
        method="get"
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
