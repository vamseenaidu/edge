"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPolicy, type PolicyRecord } from "../../../../lib/policiesClient";
import { RulepackDiff } from "../../../../components/RulepackDiff";

function DiffContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const [fromPolicy, setFromPolicy] = useState<PolicyRecord | null>(null);
  const [toPolicy, setToPolicy] = useState<PolicyRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) return;
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([getPolicy(from), getPolicy(to)]).then(([fromRes, toRes]) => {
      if (!active) return;
      setFromPolicy(fromRes.data ?? null);
      setToPolicy(toRes.data ?? null);
      if (!fromRes.ok || !toRes.ok) {
        setError(fromRes.error ?? toRes.error ?? "Unable to load policy versions.");
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [from, to]);

  if (!from || !to) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h1 style={{ margin: 0 }}>Policy Diff</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Select two policy versions to compare from the policy detail page.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading diff…</div>;
  }

  if (!fromPolicy || !toPolicy) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h1 style={{ margin: 0 }}>Policy Diff</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {error ?? "One or more policy versions could not be found."}
        </p>
        <Link href="/policies" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Back to policies
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <h1 style={{ margin: 0 }}>Policy Diff</h1>
        <div style={{ color: "var(--text-secondary)" }}>
          Comparing {fromPolicy.version} → {toPolicy.version}
        </div>
      </div>

      <RulepackDiff
        fromLabel={fromPolicy.version}
        toLabel={toPolicy.version}
        fromText={fromPolicy.text}
        toText={toPolicy.text}
      />
    </div>
  );
}

export default function PolicyDiffPage() {
  return (
    <Suspense fallback={<div style={{ color: "var(--text-muted)" }}>Loading diff…</div>}>
      <DiffContent />
    </Suspense>
  );
}
