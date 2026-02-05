import express from "express";
import { err, ok, sendJson } from "../envelope";
import { requireRole } from "../middleware/rbac_mw";
import type { RoleRequirement } from "../auth/rbac";
import { mountHealthRoutes } from "./routes_health";
import { mountJobRoutes } from "./routes_jobs";
import { mountPolicyRoutes } from "./routes_policies";

export function createV1Router(): express.Router {
  const router = express.Router();

  mountHealthRoutes(router);
  mountJobRoutes(router);

  const opsAuditAdmin: RoleRequirement = { anyOf: ["operator", "auditor", "platform_admin"] };
  const auditAdmin: RoleRequirement = { anyOf: ["auditor", "platform_admin"] };
  const adminOnly: RoleRequirement = { anyOf: ["platform_admin"] };

  mountPolicyRoutes(
    {
      get: (path: string, ...handlers: any[]) => {
        router.get(path, ...handlers);
      },
      post: (path: string, ...handlers: any[]) => {
        router.post(path, ...handlers);
      },
    },
    {
      read: requireRole(auditAdmin),
      admin: requireRole(adminOnly),
    },
  );

  router.get("/metrics", requireRole(opsAuditAdmin), (_req, res) => {
    sendJson(res, ok({}), 200);
  });
  router.get("/contract", requireRole(auditAdmin), (_req, res) => {
    sendJson(res, ok({}), 200);
  });
  router.get("/meta", requireRole(opsAuditAdmin), (_req, res) => {
    sendJson(res, ok({}), 200);
  });

  router.all("/health/live", (_req, res) => {
    sendJson(res, err("METHOD_NOT_ALLOWED", "Method not allowed"), 405);
  });
  router.all("/health/ready", (_req, res) => {
    sendJson(res, err("METHOD_NOT_ALLOWED", "Method not allowed"), 405);
  });

  return router;
}
