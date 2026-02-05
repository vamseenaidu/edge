import express from "express";
import { err, sendJson } from "../envelope";
import { mountHealthRoutes } from "./routes_health";

export function createV1Router(): express.Router {
  const router = express.Router();

  mountHealthRoutes(router);

  router.all("/health/live", (_req, res) => {
    sendJson(res, err("METHOD_NOT_ALLOWED", "Method not allowed"), 405);
  });
  router.all("/health/ready", (_req, res) => {
    sendJson(res, err("METHOD_NOT_ALLOWED", "Method not allowed"), 405);
  });

  return router;
}
