import type { Request, Response } from "express";
import { orderSchema } from "../types";

export async function order(req: Request, res: Response) {
  const parsedBody = orderSchema.safeParse(req.body);
  if (!parsedBody.success) {
    console.error(parsedBody.error);
    res.status(400).json({
      error: "Order schema not correct",
    });
    return;
  }
}
