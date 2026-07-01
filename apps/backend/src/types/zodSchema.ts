import { z } from "zod";
import { envConfig } from "../utils/env";
import { order } from "../controllers/engine.controller";

export const authSchema = z.object({
  username: z.string().min(1, "username cannot be empty"),
  password: z.string().min(1, "password cannot be empty"),
});

export interface TokenPayload {
  userId: string;
}

export const orderSchema = z.object({
  price: z.bigint(),
  market: z.string(),
  type: z.enum(["market", "limit"]),
  side: z.enum(["long", "short"]),
  qty: z.number().positive("Qty should be positive"),
  leverage: z.number().positive("Leverage should be positive"),
});
