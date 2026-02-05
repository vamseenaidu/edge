import { err, ok, sendJson } from "../envelope";
import { getActivePolicy, getPolicy, listPolicies, publishPolicy, submitDraft } from "../runtime/policies/store";
import type { PolicyDraftInput } from "../runtime/policies/types";

type PolicyRouteGuards = {
  read: (req: any, res: any, next: (err?: any) => void) => void;
  admin: (req: any, res: any, next: (err?: any) => void) => void;
};

export function mountPolicyRoutes(
  router: { get: (path: string, ...handlers: any[]) => void; post: (path: string, ...handlers: any[]) => void },
  guards: PolicyRouteGuards,
): void {
  router.get("/policies", guards.read, (_req: any, res: any) => {
    sendJson(res, ok({ policies: listPolicies() }), 200);
  });

  router.get("/policies/:version", guards.read, (req: any, res: any) => {
    const policy = getPolicy(req.params.version);
    if (!policy) {
      sendJson(res, err("NOT_FOUND", "Policy not found"), 404);
      return;
    }
    sendJson(res, ok({ policy }), 200);
  });

  router.post("/policies/draft", guards.admin, (req: any, res: any) => {
    const body = req?.body as PolicyDraftInput | undefined;
    if (!body || !isDraftInput(body)) {
      sendJson(res, err("BAD_REQUEST", "Invalid policy draft"), 400);
      return;
    }

    try {
      const policy = submitDraft(body);
      sendJson(res, ok({ policy }), 200);
    } catch {
      sendJson(res, err("BAD_REQUEST", "Policy version already exists"), 400);
    }
  });

  router.post("/policies/:version/publish", guards.admin, (req: any, res: any) => {
    const policy = publishPolicy(req.params.version);
    if (!policy) {
      sendJson(res, err("NOT_FOUND", "Policy not found"), 404);
      return;
    }
    sendJson(res, ok({ policy }), 200);
  });

  router.get("/policies/active/:domain", guards.read, (req: any, res: any) => {
    const policy = getActivePolicy(req.params.domain);
    sendJson(res, ok({ policy: policy ?? null }), 200);
  });
}

function isDraftInput(value: PolicyDraftInput): boolean {
  return isNonEmpty(value.version) && isNonEmpty(value.domain) && isNonEmpty(value.summary) && isNonEmpty(value.text);
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
