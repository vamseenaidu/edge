import { ok, sendJson } from "../envelope";
import { UnavailableError } from "../http_errors";

export function mountHealthRoutes(router: { get: (path: string, handler: any) => void }): void {
  router.get("/health/live", (_req: any, res: any) => {
    sendJson(res, ok({ status: "live" }), 200);
  });

  router.get("/health/ready", (_req: any, res: any, next: any) => {
    try {
      if (process.env.EDGE_READY === "0") {
        throw new UnavailableError("EDGE readiness disabled via EDGE_READY=0");
      }
      sendJson(res, ok({ status: "ready" }), 200);
    } catch (err) {
      next(err);
    }
  });
}
