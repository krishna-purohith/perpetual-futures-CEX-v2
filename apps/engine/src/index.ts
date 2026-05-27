interface OpenOrder {
  originalOrderId: string;
  userId: string;
  side: OrderSide;
  type: OrderType;
  market: string;
  qty: number;
  filledQty: number;
  price: Price;
}

interface BidsNAsks {
  availableQty: number;
  openOrders: OpenOrder[];
}

interface OrderBook {
  bids: Map<number, BidsNAsks>;
  asks: Map<number, BidsNAsks>;
  lastTradedPrice: number;
}

interface Position {
  market: string;
  userId: string;
  positionId: string;
  positionSide: PositionSide;
  entryPrice: bigint;
  leverage: number;
  margin: bigint;
  fundingPnl?: number;
  qty: bigint;
  positionStatus: PositionStatus;

  createdAt: number;
  updatedAt: number;

  liquidationPrice?: bigint;
  unrealizedPnl?: bigint;
}

const balances = new Map<UserId, AssetBalance>();

type AssetBalance = Map<Asset, { locked: bigint; total: bigint }>;
type PositionSide = "long" | "short";
type OrderSide = "buy" | "sell";
type OrderType = "market" | "limit";

const ORDER_BOOKS = new Map<Market, OrderBook>();
const positions = new Map<UserId, Map<Market, Position>>();

type Asset = string;
type UserId = string;
type Market = string;
type Price = number;
type PositionStatus = "open" | "closed";

// type AssetBalance = Map<Asset, {
//   total: number;
//   lockedInOrders: number;
//   lockedInPositions: number;
//   // available = total - lockedInOrders - lockedInPositions
// }>;

const PRICE_DECIMALS = 6;
const QTY_DECIMALS = 8;

function calMarginToLock(price: bigint, qty: bigint, leverage: number): bigint {
  const marginB = (price * qty) / BigInt(leverage);
  return marginB;
}

function generatePositionId() {
  return Math.random().toString();
}

function updatePosition(
  userId: string,
  market: string,
  orderSide: "buy" | "sell",
  fillQty: bigint,
  fillPrice: bigint,
  leverage: number
) {
  // get existing position
  const userPositions = positions.get(userId);
  if (!userPositions) {
    // add a new position
    positions.set(userId, new Map<Market, Position>());
  }
  const existingP = positions.get(userId)!.get(market);

  const newSide = orderSide === "buy" ? "long" : "short";

  if (!existingP) {
    const margin = calMarginToLock(fillPrice, fillQty, leverage);
    positions.get(userId)!.set(market, {
      market,
      userId,
      positionId: generatePositionId(),
      positionSide: newSide,
      entryPrice: fillPrice,
      leverage,
      margin,
      qty: fillQty,
      positionStatus: "open",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // updateBalance
    // userbalance would have locked with the maxprice * quantity / leverage.
    // so don't we have to cal the diff fillPrice * fillQty/ leverage - initialLock n release this amount from the locked n we never touch the total here
  } else if (existingP.positionSide === newSide) {
    // increase the position
    existingP.entryPrice +=
      (existingP.entryPrice * existingP.qty + fillPrice * fillQty) /
      (existingP.qty + fillQty);

    existingP.margin += calMarginToLock(fillPrice, fillQty, leverage);
    existingP.qty += fillQty;
    existingP.updatedAt = Date.now();
  } else {
    // can close few position
    // reduce, close, flip

    const qtyToClose = BigInt(Math.min(Number(existingP.qty), Number(fillQty)));

    const direction = existingP.positionSide === "long" ? +1 : -1;

    const realizedPnL =
      (fillPrice - existingP.entryPrice) * qtyToClose * BigInt(direction);

    const remainingQty = existingP.qty - qtyToClose;

    if (remainingQty === BigInt(0)) {
      // close
      userPositions?.delete(market);
    } else if (remainingQty > 0) {
      // reduce
      existingP.margin -= (existingP.margin / existingP.qty) * qtyToClose;
      existingP.qty -= qtyToClose;
      existingP.updatedAt = Date.now();
    } else if (remainingQty < 0) {
      // flip
      existingP.positionSide =
        existingP.positionSide === "long" ? "short" : "long";
      const qtyToFlip = remainingQty * BigInt(-1);
      existingP.entryPrice = qtyToFlip * fillPrice;
      existingP.margin = calMarginToLock(fillPrice, qtyToFlip, leverage);
      existingP.qty = qtyToFlip;
      existingP.updatedAt = Date.now();
    }
  }
}

function releaseExcessMargin(
  userId: string,
  lockedPrice: bigint,
  fillPrice: bigint,
  fillQty: bigint,
  leverage: number
) {
  const lockedMargin = calMarginToLock(lockedPrice, fillQty, leverage);
  const actualmargin = calMarginToLock(fillPrice, fillQty, leverage);
  const excess = actualmargin - lockedMargin;

  // release excess margin.
}

function matchBuyOrder() {}

function matchSellOrder() {}
