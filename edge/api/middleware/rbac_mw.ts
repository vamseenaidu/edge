import type { RequestHandler } from "express";
import { err, sendJson } from "../envelope";
import { loadAuthConfig } from "../config/auth";
import { isRoleAllowed, parseRoleHeader, type RoleRequirement } from "../auth/rbac";

const forbidden = (res: any, message: string) => {
  sendJson(res, err("UNAVAILABLE", message), 403);
};

export function requireRole(requirement: RoleRequirement): RequestHandler {
  return (req, res, next) => {
    const { enabled } = loadAuthConfig();
    if (!enabled) {
      next();
      return;
    }

    const role = parseRoleHeader(req.headers?.["x-edge-role"]);
    if (!role) {
      forbidden(res, "Role required");
      return;
    }

    if (!isRoleAllowed(role, requirement)) {
      forbidden(res, "Role not permitted");
      return;
    }

    next();
  };
}
