export interface EngineRequest {
  market: string;
  type: OrderType;
  side: Side;
  qty: number;
}

export type OrderType = "market" | "limit";
export type Side = "long" | "short";
