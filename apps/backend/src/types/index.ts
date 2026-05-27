import { z } from "zod";
import { envConfig } from "../utils/env";

export const authSchema = z.object({
  username: z.string().min(1, "username cannot be empty"),
  password: z.string().min(1, "password cannot be empty"),
});

export interface TokenPayload {
  userId: string;
}

export const orderSchema = z.object({
  market: z.string(),
  type: z.enum(["market", "limit"]),
  side: z.enum(["long", "short"]),
  qty: z.number().positive("Qty should be positive"),
});

export interface EngineRequest {
  market: string;
  type: OrderType;
  side: Side;
  qty: number;
}

export type OrderType = "market" | "limit";
export type Side = "long" | "short";

function sendToEngine(engineRequest: EngineRequest) {
  const correlationId = crypto.randomUUID();
}
