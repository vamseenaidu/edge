import type { Request } from "express";
import type { TenantContextValue } from "./types";

export type EdgeRequest = Request & { edge_tenant_id?: TenantContextValue };

export function setTenantContext(req: Request, tenantId: TenantContextValue): void {
  (req as EdgeRequest).edge_tenant_id = tenantId;
}

export function getTenantContext(req: Request): TenantContextValue {
  const tenantId = (req as EdgeRequest).edge_tenant_id;
  return tenantId ?? null;
}
