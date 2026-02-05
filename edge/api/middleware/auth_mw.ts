import type { RequestHandler } from "express";
import { setActorContext } from "../auth/context";
import type { ActorContext, ActorContextValue, ActorType, AuthProvider } from "../auth/types";
import type { AuthConfig } from "../config/auth";

const headerValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    const first = value.find((entry) => entry && entry.trim());
    return first ? first.trim() : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
};

const parseActorType = (raw: string | undefined): ActorType => {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "human" || normalized === "service") {
    return normalized as ActorType;
  }
  return null;
};

const parseAuthProvider = (raw: string | undefined): AuthProvider => {
  if (!raw) return "none";
  const normalized = raw.trim().toLowerCase();
  if (normalized === "oidc" || normalized === "saml") {
    return normalized as AuthProvider;
  }
  return "none";
};

const parseAuthorizationToken = (raw: string | undefined): string | null => {
  if (!raw) return null;
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const scheme = parts[0]?.toLowerCase();
  if (scheme !== "bearer" && scheme !== "token") return null;
  const token = parts.slice(1).join(" ").trim();
  return token || null;
};

const decodeBase64Url = (input: string): string | null => {
  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4;
    const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
    return Buffer.from(padded, "base64").toString("utf8");
  } catch (err) {
    return null;
  }
};

const parseJwtSubject = (token: string): string | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = decodeBase64Url(parts[1] ?? "");
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as { sub?: unknown };
    if (typeof parsed.sub === "string" && parsed.sub.trim()) {
      return parsed.sub.trim();
    }
  } catch (err) {
    return null;
  }
  return null;
};

const buildActorContext = (req: any): ActorContextValue => {
  const actorIdHeader = headerValue(req.headers?.["x-edge-actor-id"]);
  const actorTypeHeader = headerValue(req.headers?.["x-edge-actor-type"]);
  const providerHeader = headerValue(req.headers?.["x-edge-auth-provider"]);
  const authHeader = headerValue(req.headers?.authorization);

  const hasAuthSignals = Boolean(actorIdHeader || actorTypeHeader || providerHeader || authHeader);
  if (!hasAuthSignals) return null;

  const token = parseAuthorizationToken(authHeader);
  const jwtSubject = token ? parseJwtSubject(token) : null;
  const actor_id = actorIdHeader ?? jwtSubject ?? null;
  const actor_type = parseActorType(actorTypeHeader);
  const auth_provider = parseAuthProvider(providerHeader);

  const actor: ActorContext = {
    actor_id,
    actor_type,
    auth_provider,
  };

  return actor;
};

export function createAuthMiddleware(config: AuthConfig): RequestHandler {
  return (req, _res, next) => {
    if (!config.enabled) {
      setActorContext(req, null);
      next();
      return;
    }

    const actor = buildActorContext(req);
    setActorContext(req, actor);
    next();
  };
}
