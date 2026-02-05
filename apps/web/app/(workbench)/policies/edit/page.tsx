"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getRole, type EdgeRole } from "../../../../lib/rbac";
import { addPolicy, getPolicy, hasPolicy, listPolicies } from "../../../../lib/mockPolicies";
import { validatePolicyDraft, ValidationResult } from "../../../../lib/policyValidator";
import { InlineStatus } from "../../../../components/InlineStatus";

function PolicyEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policies = listPolicies();
  const [role, setRoleState] = useState<EdgeRole>("auditor");
  const baseFromQuery = searchParams.get("base");
  const initialBase = baseFromQuery && hasPolicy(baseFromQuery) ? baseFromQuery : policies[0]?.version ?? "";

  const [baseVersion, setBaseVersion] = useState(initialBase);
  const [newVersion, setNewVersion] = useState("");
  const [summary, setSummary] = useState("");
  const [draftText, setDraftText] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  useEffect(() => {
    if (baseFromQuery && hasPolicy(baseFromQuery) && baseFromQuery !== baseVersion) {
      setBaseVersion(baseFromQuery);
    }
  }, [baseFromQuery, baseVersion]);

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  useEffect(() => {
    const basePolicy = getPolicy(baseVersion);
    setDraftText(basePolicy?.text ?? "");
    setSummary(basePolicy?.summary ?? "");
    setValidation(null);
  }, [baseVersion]);

  const trimmedVersion = newVersion.trim();
  const duplicateVersion = trimmedVersion.length > 0 && hasPolicy(trimmedVersion);
  const statusTone = validation ? (validation.ok ? "ok" : "fail") : "draft";
  const statusLabel = validation ? (validation.ok ? "OK" : "FAIL") : "Draft";

  const handleValidate = () => {
    const result = validatePolicyDraft({ text: draftText, newVersion: trimmedVersion, baseVersion });
    setValidation(result);
  };

  const handlePublish = () => {
    const result = validatePolicyDraft({ text: draftText, newVersion: trimmedVersion, baseVersion });
    setValidation(result);
    if (!result.ok) return;
    if (hasPolicy(trimmedVersion)) return;

    addPolicy({
      version: trimmedVersion,
      summary: summary.trim(),
      text: result.normalizedText,
    });

    router.push(`/policies/${encodeURIComponent(trimmedVersion)}`);
  };

  const canPublish = Boolean(validation?.ok) && !duplicateVersion;
  const canEdit = role === "policy_author" || role === "platform_admin";

  if (!canEdit) {
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
          gap: "var(--space-2)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>Forbidden</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Your current role does not permit policy editing.
        </div>
        <Link href="/policies" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Back to policies
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>Policy Draft</div>
          <h1 style={{ margin: 0 }}>Draft → Validate → Publish</h1>
        </div>
        <Link href="/policies" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Back to policies
        </Link>
      </div>

      <div
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          background: "var(--surface-1)",
          boxShadow: "var(--shadow-soft)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          Base version
          <select
            value={baseVersion}
            onChange={(event) => {
              setBaseVersion(event.target.value);
              setValidation(null);
            }}
            style={{
              padding: "6px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-0)",
            }}
          >
            {policies.map((policy) => (
              <option key={policy.version} value={policy.version}>
                {policy.version}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          New version
          <input
            value={newVersion}
            onChange={(event) => {
              setNewVersion(event.target.value);
              setValidation(null);
            }}
            placeholder="edge-clinical.v1.1.1"
            style={{
              padding: "6px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-0)",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          Summary
          <input
            value={summary}
            onChange={(event) => {
              setSummary(event.target.value);
              setValidation(null);
            }}
            placeholder="Short description of changes"
            style={{
              padding: "6px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-0)",
            }}
          />
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
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
          <div style={{ fontSize: 14, fontWeight: 600 }}>Draft Text</div>
          <textarea
            value={draftText}
            onChange={(event) => {
              setDraftText(event.target.value);
              setValidation(null);
            }}
            rows={18}
            style={{
              width: "100%",
              minHeight: 320,
              resize: "vertical",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-0)",
              padding: "var(--space-3)",
              fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
              fontSize: 13,
            }}
          />
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button
              type="button"
              onClick={handleValidate}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-0)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Validate
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-0)",
                fontWeight: 600,
                cursor: canPublish ? "pointer" : "not-allowed",
                opacity: canPublish ? 1 : 0.6,
              }}
            >
              Publish
            </button>
          </div>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Validation</div>
            <InlineStatus tone={statusTone} label={statusLabel} />
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {validation
              ? validation.ok
                ? "Draft passes deterministic validation checks."
                : "Draft has validation findings that must be resolved."
              : "Run validation before publishing."}
          </div>
          {duplicateVersion && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Version already exists; choose a new version before publishing.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {(validation?.findings?.length ?? 0) > 0 ? (
              validation?.findings.map((finding, index) => (
                <div key={`${finding.code}-${index}`} style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{finding.code}</span>
                  {typeof finding.line === "number" && (
                    <span style={{ color: "var(--text-muted)" }}> · line {finding.line}</span>
                  )}
                  <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>{finding.message}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {validation ? "No findings." : "Validation findings will appear here."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PolicyEditPage() {
  return (
    <Suspense fallback={<div style={{ color: "var(--text-secondary)" }}>Loading editor…</div>}>
      <PolicyEditContent />
    </Suspense>
  );
}
