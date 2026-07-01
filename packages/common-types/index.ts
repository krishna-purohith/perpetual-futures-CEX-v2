export type Side = "buy" | "sell";
export type OrderType = "market" | "limit";
export type PositionSide = "long" | "short";
export type PositionStatus = "open" | "closed";

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
  createdAt: number;
}

export type EngineCommandType =
  | "create_order"
  | "get_user_balance"
  | "get_order"
  | "get_depth"
  | "cancel_order";

export interface EnginePayload {
  orderId: string;
  market: string;
  type: OrderType;
  price: bigint;
  side: Side;
  qty: bigint;
  leverage: number;
  userId: string;
  slippage?: number;
}

export interface EngineRequest {
  correlationId: string;
  command: EngineCommandType;
  payload: EnginePayload;
}
export interface EngineResponse {
  correlationId: string;
  orderId: string;
  orderStatus: "filled" | "partial" | "open" | "rejected" | "cancelled";
  filledQty: bigint;
  avgPrice: bigint;
  fills: Fill[];
  position: Position | null;
}

export interface Position {
  market: string;
  userId: string;
  positionId: string;
  positionSide: PositionSide;
  entryPrice: bigint;
  leverage: number;
  margin: bigint;
  fundingPnl?: bigint;
  qty: bigint;
  positionStatus: PositionStatus;

  createdAt: number;
  updatedAt: number;

  liquidationPrice?: bigint;
  unrealizedPnl?: bigint;
}
