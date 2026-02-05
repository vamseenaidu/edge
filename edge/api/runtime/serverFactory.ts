import express, { RequestHandler, Router } from "express";
import { createV1Router } from "../v1/router";
import { err, sendJson } from "../envelope";
import { toErrEnvelope } from "../http_errors";
import { createAuthMiddleware } from "../middleware/auth_mw";
import { loadAuthConfig } from "../config/auth";

export type CreateServerOptions = {
  router?: Router;
  authMiddleware?: RequestHandler;
  jsonLimit?: string;
};

export function createServer(options: CreateServerOptions = {}): express.Express {
  const app = express();
  app.use(express.json({ limit: options.jsonLimit ?? "1mb" }));

  const authMiddleware = options.authMiddleware ?? createAuthMiddleware(loadAuthConfig());
  app.use(authMiddleware);

  const router = options.router ?? createV1Router();
  app.use("/api/v1", router);

  app.use((req, res) => {
    sendJson(res, err("NOT_FOUND", "Route not found"), 404);
  });

  app.use((error: any, req: any, res: any, _next: any) => {
    const envelope = toErrEnvelope(error);
    let status = 500;
    switch (envelope.error.code) {
      case "BAD_REQUEST":
        status = 400;
        break;
      case "VALIDATION":
        status = 422;
        break;
      case "NOT_FOUND":
        status = 404;
        break;
      case "METHOD_NOT_ALLOWED":
        status = 405;
        break;
      case "UNAVAILABLE":
        status = 503;
        break;
      case "RATE_LIMITED":
        status = 429;
        break;
      default:
        status = 500;
    }
    sendJson(res, envelope, status);
  });

  return app;
}
