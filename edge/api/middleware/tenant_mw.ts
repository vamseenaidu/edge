import type { RequestHandler } from "express";
import { BadRequestError } from "../http_errors";
import { setTenantContext } from "../tenant/context";

const parseTenantId = (raw: string | string[] | undefined): { tenantId: string | null; invalid: boolean } => {
  if (raw === undefined) {
    return { tenantId: null, invalid: false };
  }

  if (Array.isArray(raw)) {
    const trimmed = raw.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean);
    if (trimmed.length === 0) {
      return { tenantId: null, invalid: true };
    }
    return { tenantId: trimmed[0] ?? null, invalid: false };
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { tenantId: null, invalid: true };
    }
    return { tenantId: trimmed, invalid: false };
  }

  return { tenantId: null, invalid: true };
};

export function createTenantMiddleware(): RequestHandler {
  return (req, _res, next) => {
    const { tenantId, invalid } = parseTenantId(req.headers?.["x-edge-tenant-id"]);

    if (invalid) {
      next(new BadRequestError("Invalid tenant id"));
      return;
    }

    setTenantContext(req, tenantId);
    next();
  };
}
