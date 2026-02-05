import { err, normalizeErrorMessage } from "./envelope";

class BaseHttpError extends Error {
  code: "BAD_REQUEST" | "NOT_FOUND" | "VALIDATION" | "UNAVAILABLE" | "METHOD_NOT_ALLOWED" | "RATE_LIMITED";
  details?: Record<string, unknown>;

  constructor(
    code: "BAD_REQUEST" | "NOT_FOUND" | "VALIDATION" | "UNAVAILABLE" | "METHOD_NOT_ALLOWED" | "RATE_LIMITED",
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class BadRequestError extends BaseHttpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("BAD_REQUEST", message, details);
  }
}

export class NotFoundError extends BaseHttpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("NOT_FOUND", message, details);
  }
}

export class ValidationError extends BaseHttpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION", message, details);
  }
}

export class UnavailableError extends BaseHttpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("UNAVAILABLE", message, details);
  }
}

export function toErrEnvelope(e: unknown) {
  let code: "INTERNAL" | "BAD_REQUEST" | "NOT_FOUND" | "VALIDATION" | "UNAVAILABLE" | "METHOD_NOT_ALLOWED" | "RATE_LIMITED" =
    "INTERNAL";
  let message = "Unknown error";
  let details: Record<string, unknown> | undefined;

  if (e instanceof BaseHttpError) {
    code = e.code;
    message = e.message || message;
    details = e.details;
  } else if (e instanceof Error) {
    message = e.message || message;
  } else if (typeof e === "string") {
    message = e;
  }

  return err(code, normalizeErrorMessage(message), details);
}
