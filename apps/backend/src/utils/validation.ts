import { z, ZodError } from "zod";
import { type Response } from "express";

export function sendValidationError(err: ZodError, res: Response) {
  res.status(400).json({
    error: "validation_error",
    path: err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  });
}
