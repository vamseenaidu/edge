export type OkEnvelope<T> = {
  kind: "edge.ok";
  api_version: "v1";
  data: T;
};

export type ErrEnvelope = {
  kind: "edge.error";
  api_version: "v1";
  error: {
    code:
      | "BAD_REQUEST"
      | "NOT_FOUND"
      | "METHOD_NOT_ALLOWED"
      | "INTERNAL"
      | "UNAVAILABLE"
      | "VALIDATION"
      | "RATE_LIMITED";
    message: string;
    details?: Record<string, unknown>;
  };
};

export function ok<T>(data: T): OkEnvelope<T> {
  return {
    kind: "edge.ok",
    api_version: "v1",
    data,
  };
}

export function err(
  code: ErrEnvelope["error"]["code"],
  message: string,
  details?: Record<string, unknown>,
): ErrEnvelope {
  const envelope: ErrEnvelope = {
    kind: "edge.error",
    api_version: "v1",
    error: {
      code,
      message,
      ...(details && Object.keys(details).length ? { details } : {}),
    },
  };
  return envelope;
}

export function normalizeErrorMessage(message: string, max = 240): string {
  if (message.length <= max) return message;
  return message.slice(0, max);
}

export function sendJson(res: any, value: any, statusCode: number): void {
  const json = JSON.stringify(value);
  res.set("Content-Type", "application/json; charset=utf-8");
  res.status(statusCode).send(json);
}
