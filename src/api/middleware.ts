import { NextFunction, Request, Response } from "express";
import { groundRequestSchema } from "./contract";

export function validateGroundRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const parsed = groundRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "INVALID_REQUEST",
      details: parsed.error.flatten(),
    });
  }

  // Explicit, typed handoff via res.locals (no global augmentation)
  res.locals.groundRequest = parsed.data;
  next();
}
