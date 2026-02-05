import crypto from "node:crypto";
import { canonicalizeJson, stringifyCanonical } from "../audit/canonicalize";

export function hashRequestCanonical(payload: unknown): { fingerprint: string; canonical_json: string } {
  const canonical = canonicalizeJson(payload);
  const json = stringifyCanonical(canonical);
  const fingerprint = crypto.createHash("sha256").update(json).digest("hex");
  return { fingerprint, canonical_json: json };
}
