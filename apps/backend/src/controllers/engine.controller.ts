import type { Request, Response } from "express";
import { loopback } from "../loopback";
import { orderSchema } from "../types/zodSchema";

export async function order(req: Request, res: Response) {
  const parsedBody = orderSchema.safeParse(req.body);

  if (!parsedBody.success) {
    console.error(parsedBody.error);
    res.status(400).json({
      error: "Order schema not correct",
    });
    return;
  }

  const orderId = Math.random();
  const payload = { ...parsedBody.data, userId: req.userId!, orderId };

  try {
    const response = await loopback(payload);
    console.log("before resopnse");
    res.status(200).json({
      response,
    });
  } catch (error) {
    res.status(500).json({
      error: error,
    });
  }
}
