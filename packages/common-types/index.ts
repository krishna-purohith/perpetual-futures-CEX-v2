export interface EngineRequest {
  market: string;
  type: OrderType;
  side: Side;
  qty: number;
}

export type OrderType = "market" | "limit";
export type Side = "long" | "short";

export interface Fill {
  id: string;
  market: string;
  makerId: string;
  takerId: string;
  side: "buy" | "sell";
  price: bigint;
  qty: bigint;
  makerOrderId: string;
  takerOrderId: string;
  createdAt: string;
}
