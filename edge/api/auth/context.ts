import type { Request } from "express";
import type { ActorContextValue } from "./types";

export type EdgeRequest = Request & { edge_actor?: ActorContextValue };

export function setActorContext(req: Request, actor: ActorContextValue): void {
  (req as EdgeRequest).edge_actor = actor;
}

export function getActorContext(req: Request): ActorContextValue {
  const actor = (req as EdgeRequest).edge_actor;
  return actor ?? null;
}
