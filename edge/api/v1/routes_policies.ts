import { err, ok, sendJson } from "../envelope";
import { getPolicy, listPolicies } from "../runtime/policies/store";

export function mountPolicyRoutes(router: { get: (path: string, ...handlers: any[]) => void }): void {
  router.get("/policies", (_req: any, res: any) => {
    sendJson(res, ok({ policies: listPolicies() }), 200);
  });

  router.get("/policies/:version", (req: any, res: any) => {
    const policy = getPolicy(req.params.version);
    if (!policy) {
      sendJson(res, err("NOT_FOUND", "Policy not found"), 404);
      return;
    }
    sendJson(res, ok({ policy }), 200);
  });
}
