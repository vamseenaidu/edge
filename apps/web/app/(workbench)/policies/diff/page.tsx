"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPolicy } from "../../../../lib/mockPolicies";
import { RulepackDiff } from "../../../../components/RulepackDiff";

function DiffContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const { fromPolicy, toPolicy } = useMemo(() => {
    return {
      fromPolicy: from ? getPolicy(from) : null,
      toPolicy: to ? getPolicy(to) : null,
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

  if (!fromPolicy || !toPolicy) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <h1 style={{ margin: 0 }}>Policy Diff</h1>
        <p style={{ color: "var(--text-secondary)" }}>One or more policy versions could not be found.</p>
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
