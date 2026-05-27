import type { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../utils/env";
import type { TokenPayload } from "../types";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;
  if (!token) {
    res.status(403).json({
      error: "No auth token",
    });
    return;
  }

  const decoded = jwt.verify(token, envConfig.jwt_secret) as TokenPayload;
  if (typeof decoded.userId !== "string") {
    res.status(403).json({
      error: "Invalid token",
    });
    return;
  }

  req.userId = decoded.userId;
  next();
}
