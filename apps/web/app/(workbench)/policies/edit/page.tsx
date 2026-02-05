"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getRole, type EdgeRole } from "../../../../lib/rbac";
import {
  getPolicy,
  listPolicies,
  publish,
  submitDraft,
  type PolicyRecord,
  type PolicySummary,
} from "../../../../lib/policiesClient";
import { validatePolicyDraft, type ValidationResult } from "../../../../lib/policyValidator";
import { InlineStatus } from "../../../../components/InlineStatus";

function PolicyEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const baseFromQuery = searchParams.get("base");

  const [role, setRoleState] = useState<EdgeRole>("auditor");
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [policiesError, setPoliciesError] = useState<string | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  const [baseVersion, setBaseVersion] = useState("");
  const [baseDomain, setBaseDomain] = useState("default");
  const [newVersion, setNewVersion] = useState("");
  const [summary, setSummary] = useState("");
  const [draftText, setDraftText] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  useEffect(() => {
    let active = true;
    listPolicies().then((res) => {
      if (!active) return;
      setPolicies(res.data ?? []);
      setPoliciesError(res.ok ? null : res.error ?? "Unable to load policies.");
      setPoliciesLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (policiesLoading) return;
    const baseMatch = baseFromQuery && policies.find((policy) => policy.version === baseFromQuery);
    const nextBase = baseMatch ? baseFromQuery : policies[0]?.version ?? "";
    if (nextBase && nextBase !== baseVersion) {
      setBaseVersion(nextBase);
    }
  }, [policiesLoading, policies, baseFromQuery, baseVersion]);

  useEffect(() => {
    let active = true;
    if (!baseVersion) {
      setDraftText("");
      setSummary("");
      setBaseDomain("default");
      return;
    }
    getPolicy(baseVersion).then((res) => {
      if (!active) return;
      const policy = res.data as PolicyRecord | null;
      setDraftText(policy?.text ?? "");
      setSummary(policy?.summary ?? "");
      setBaseDomain(policy?.domain ?? "default");
      setValidation(null);
    });
    return () => {
      active = false;
    };
  }, [baseVersion]);

  const trimmedVersion = newVersion.trim();
  const duplicateVersion = trimmedVersion.length > 0 && policies.some((policy) => policy.version === trimmedVersion);
  const statusTone = validation ? (validation.ok ? "ok" : "fail") : "draft";
  const statusLabel = validation ? (validation.ok ? "OK" : "FAIL") : "Draft";

  const handleValidate = () => {
    const result = validatePolicyDraft({ text: draftText, newVersion: trimmedVersion, baseVersion });
    setValidation(result);
    setPublishError(null);
  };

  const handlePublish = async () => {
    setPublishError(null);
    const result = validatePolicyDraft({ text: draftText, newVersion: trimmedVersion, baseVersion });
    setValidation(result);
    if (!result.ok) return;
    if (duplicateVersion) {
      setPublishError("Version already exists; choose a new version before publishing.");
      return;
    }

    setPublishBusy(true);
    const draftInput = {
      version: trimmedVersion,
      domain: baseDomain || "default",
      summary: summary.trim(),
      text: result.normalizedText,
    };

    const draftRes = await submitDraft(draftInput);
    if (!draftRes.ok && draftRes.status !== 409) {
      setPublishError(draftRes.error ?? "Draft submission failed.");
      setPublishBusy(false);
      return;
    }

    const publishRes = await publish(trimmedVersion);
    if (!publishRes.ok) {
      setPublishError(publishRes.error ?? "Publish failed.");
      setPublishBusy(false);
      return;
    }

    router.push(`/policies/${encodeURIComponent(trimmedVersion)}`);
  };

  const canPublish = Boolean(validation?.ok) && !duplicateVersion && !publishBusy;
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

      {policiesError && (
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            background: "var(--surface-1)",
            boxShadow: "var(--shadow-soft)",
            color: "var(--text-secondary)",
            fontSize: 13,
          }}
        >
          {policiesError}
        </div>
      )}

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
            disabled={policiesLoading || policies.length === 0}
            style={{
              padding: "6px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-0)",
            }}
          >
            {policies.length === 0 ? (
              <option value="">No policies available</option>
            ) : (
              policies.map((policy) => (
                <option key={policy.version} value={policy.version}>
                  {policy.version}
                </option>
              ))
            )}
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
              {publishBusy ? "Publishing…" : "Publish"}
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
          {publishError && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{publishError}</div>}
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
