import type { Request } from "express";
import { loadAuthConfig } from "../config/auth";
import { parseRoleHeader, type EdgeRole } from "../auth/rbac";
import type { ActorContextValue } from "../auth/types";
import { getTenantContext } from "../tenant/context";

export type Attribution = {
  actor_id: string | null;
  actor_type: ActorContextValue extends { actor_type: infer T } ? T | null : string | null;
  auth_provider: ActorContextValue extends { auth_provider: infer T } ? T | null : string | null;
  role: EdgeRole | null;
  tenant_id: string | null;
};

const readActorContext = (req: Request): ActorContextValue => {
  return (req as { edge_actor?: ActorContextValue }).edge_actor ?? null;
};

export function getAttribution(req: Request): Attribution {
  const { enabled } = loadAuthConfig();
  const actor = enabled ? readActorContext(req) : null;
  const role = enabled ? parseRoleHeader(req.headers?.["x-edge-role"]) : null;
  const tenant = getTenantContext(req);

  return {
    actor_id: actor?.actor_id ?? null,
    actor_type: actor?.actor_type ?? null,
    auth_provider: actor?.auth_provider ?? null,
    role,
    tenant_id: tenant ?? null,
  };
}

export function attachAttributionMetadata(
  metadata: Record<string, unknown> | undefined,
  req: Request,
): Record<string, unknown> {
  const base = metadata ?? {};
  return {
    ...base,
    attribution: getAttribution(req),
  };
}
