import type { Fill } from "types";

interface OpenOrder {
  originalOrderId: string;
  userId: string;
  side: OrderSide;
  type: OrderType;
  market: string;
  qty: bigint;
  filledQty: bigint;
  price: Price;
  leverage: number;
}

interface BidsNAsks {
  availableQty: bigint;
  openOrders: OpenOrder[];
}

interface OrderBook {
  bids: Map<bigint, BidsNAsks>;
  asks: Map<bigint, BidsNAsks>;
  lastTradedPrice: bigint;
}

interface Position {
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
type Price = bigint;
type PositionStatus = "open" | "closed";

const PRICE_DECIMALS = 6;
const QTY_DECIMALS = 8;

function calMarginToLock(price: bigint, qty: bigint, leverage: number): bigint {
  const marginB = (price * qty) / BigInt(leverage);
  return marginB / BigInt(10 ** QTY_DECIMALS);
}

function generatePositionId() {
  return crypto.randomUUID();
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
  let userPositions = positions.get(userId);
  if (!userPositions) {
    // add a new position
    userPositions = new Map<Market, Position>();
    positions.set(userId, userPositions);
  }

  const existingP = positions.get(userId)!.get(market);

  const newSide = orderSide === "buy" ? "long" : "short";

  if (!existingP) {
    const margin = calMarginToLock(fillPrice, fillQty, leverage);
    const position = {
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
    };
    positions.get(userId)!.set(market, position);
    return position;
  } else if (existingP.positionSide === newSide) {
    // increase the position
    existingP.entryPrice =
      (existingP.entryPrice * existingP.qty + fillPrice * fillQty) /
      (existingP.qty + fillQty);

    existingP.margin += calMarginToLock(fillPrice, fillQty, leverage);
    existingP.qty += fillQty;
    existingP.updatedAt = Date.now();

    return userPositions.get(market);
  } else {
    // can close few position
    // reduce, close, flip

    // exixBids = 10, qtyToClose(asks) = 15,

    const qtyToClose = existingP.qty > fillQty ? fillQty : existingP.qty;

    const direction = existingP.positionSide === "long" ? +1 : -1;

    const realizedPnL =
      (fillPrice - existingP.entryPrice) * qtyToClose * BigInt(direction);

    const quote = getQuoteAsset(market);
    const userBalance = balances.get(userId)!.get(quote)!;

    const remainingQty = existingP.qty - fillQty;

    if (remainingQty === BigInt(0)) {
      // close
      const marginToRelease = existingP.margin;
      userBalance.locked -= marginToRelease;
      userBalance.total += realizedPnL;

      userPositions?.delete(market);
      return "position closed";
    } else if (remainingQty > 0n) {
      // reduce
      const marginToRelease = (existingP.margin / existingP.qty) * qtyToClose;
      userBalance.locked -= marginToRelease;
      userBalance.total += realizedPnL;

      existingP.margin -= marginToRelease;
      existingP.qty -= qtyToClose;
      existingP.updatedAt = Date.now();

      return userPositions?.get(market);
    } else if (remainingQty < 0n) {
      // flip

      const marginToRelease = existingP.margin;
      userBalance.locked -= marginToRelease;
      userBalance.total += realizedPnL;

      existingP.positionSide =
        existingP.positionSide === "long" ? "short" : "long";

      const qtyToFlip = remainingQty * BigInt(-1);

      const newMargin = calMarginToLock(fillPrice, qtyToFlip, leverage);

      userBalance.locked += newMargin;

      existingP.entryPrice = fillPrice;
      existingP.margin = newMargin;
      existingP.qty = qtyToFlip;
      existingP.updatedAt = Date.now();

      return userPositions?.get(market);
    }
  }
}

function matchBuyOrder(
  userId: string,
  orderId: string,
  qty: bigint,
  maxPrice: bigint,
  orderType: "market" | "limit",
  orderSide: "buy",
  market: string,
  leverage: number
) {
  // check if user has enough balance
  const res = balanceChecknLock(userId, market, maxPrice, qty, leverage);
  if (!res.success) {
    return res.error;
  }
  let qtyFilledTillNow = 0n;
  let totalCost = 0n;
  const fills: Fill[] = [];

  const orderbook = ORDER_BOOKS.get(market);

  if (!orderbook) {
    ORDER_BOOKS.set(market, {
      bids: new Map<bigint, BidsNAsks>(),
      asks: new Map<bigint, BidsNAsks>(),
      lastTradedPrice: 0n,
    });

    if (orderType === "market") {
      // reject the order
      // create the return object
      return {
        orderStatus: "rejected",
        filledDetails: {
          totalQty: qty,
          filledQty: 0n,
          avgPrice: null,
          fills,
          positions: null,
        },
        placedInOrderbook: {
          totalQty: qty,
          openOrderQty: qty,
        },
      };
    } else if (orderType === "limit") {
      // place the order on the book

      placeOrderInOrderbook(
        orderId,
        userId,
        "buy",
        market,
        qty,
        maxPrice,
        leverage
      );
    }
    // create the return object
    return {
      orderStatus: "open",
      filledDetails: {
        totalQty: qty,
        filledQty: 0n,
        avgPrice: null,
        fills,
        positions: null,
      },
      placedInOrderbook: {
        totalQty: qty,
        openOrderQty: qty,
      },
    };
  }

  // start matching from the order book.
  const prices = orderbook.asks.entries();

  const sortedAsks = new Map(
    Array.from(prices).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  );

  for (const [price, bid] of sortedAsks) {
    if (price > maxPrice) {
      break;
    }
    for (let i = 0; i < bid.openOrders.length; i++) {
      const order = bid.openOrders[i];
      if (!order) {
        continue;
      }
      const remainingQty = qty - qtyFilledTillNow;
      const availableQty = order.qty - order.filledQty;
      const filledInThisOrder =
        availableQty > remainingQty ? remainingQty : availableQty;
      totalCost += price * filledInThisOrder;
      qtyFilledTillNow += filledInThisOrder;
      order.filledQty += filledInThisOrder;
      bid.availableQty -= filledInThisOrder;

      const makerId = order.userId;
      const takerId = userId;
      const makerOrderId = order.originalOrderId;
      const takerOrderId = orderId;
      const createdAt = Date.now();

      fills.push({
        id: crypto.randomUUID(),
        market,
        makerId,
        takerId,
        side: "buy",
        price: order.price,
        qty: filledInThisOrder,
        makerOrderId,
        takerOrderId,
        createdAt,
      });

      orderbook.lastTradedPrice = price;

      // update taker position n release excess margin
      updatePosition(userId, market, "buy", filledInThisOrder, price, leverage);
      releaseExcessMargin(
        userId,
        maxPrice,
        price,
        filledInThisOrder,
        leverage,
        market
      );

      // update maker position n release excess margin
      updatePosition(
        order.userId,
        market,
        "sell",
        filledInThisOrder,
        price,
        order.leverage
      );
      releaseExcessMargin(
        order.userId,
        order.price,
        price,
        filledInThisOrder,
        leverage,
        market
      );

      if (order.filledQty === order.qty) {
        // remove order from orderbook
        orderbook.asks.get(price)?.openOrders.splice(i, 1);
        i--;
      }

      if (qtyFilledTillNow === qty) break;
    }

    if (bid.availableQty === 0n) {
      orderbook.asks.delete(price);
    }
  }

  if (qtyFilledTillNow === 0n) {
    if (orderType === "market") {
      return {
        orderStatus: "rejected",
        filledDetails: {
          totalQty: qty,
          filledQty: qtyFilledTillNow,
          avgPrice: qtyFilledTillNow > 0n ? totalCost / qtyFilledTillNow : 0n,
          fills,
          position: null,
        },
      };
    } else if (orderType === "limit") {
      placeOrderInOrderbook(
        orderId,
        userId,
        "buy",
        market,
        qty,
        maxPrice,
        leverage
      );

      return {
        orderStatus: "open",
        filledDetails: {
          totalQty: qty,
          filledQty: qtyFilledTillNow,
          avgPrice: qtyFilledTillNow > 0n ? totalCost / qtyFilledTillNow : 0n,
          fills,
          position: null,
        },
      };
    }
  }

  if (qtyFilledTillNow === qty) {
    if (orderType === "market") {
      return {
        orderStatus: "filled",
        filledDetails: {
          totalQty: qty,
          filledQty: qtyFilledTillNow,
          avgPrice: qtyFilledTillNow > 0n ? totalCost / qtyFilledTillNow : 0n,
          fills,
          position: null,
        },
      };
    } else if (orderType === "limit") {
      const position = positions.get(userId)?.get(market);

      return {
        orderStatus: "filled",
        filledDetails: {
          totalQty: qty,
          filledQty: qtyFilledTillNow,
          avgPrice: qtyFilledTillNow > 0 ? totalCost / qtyFilledTillNow : 0,
          fills,
          position,
        },
      };
    }
  }

  if (qtyFilledTillNow < qty) {
    if (orderType === "market") {
      // cancel
      return {
        orderStatus: "partial",
        filledDetails: {
          totalQty: qty,
          filledQty: qtyFilledTillNow,
          avgPrice: qtyFilledTillNow > 0 ? totalCost / qtyFilledTillNow : 0,
          fills,
          position: null,
        },
        rejectedQty: qty - qtyFilledTillNow,
      };
    } else if (orderType === "limit") {
      placeOrderInOrderbook(
        orderId,
        userId,
        "buy",
        market,
        qty - qtyFilledTillNow,
        maxPrice,
        leverage
      );
      const position = positions.get(userId)?.get(market);

      return {
        orderStatus: "partial",
        orderId,
        filledDetails: {
          totalQty: qty,
          filledQty: qtyFilledTillNow,
          avgPrice: qtyFilledTillNow > 0 ? totalCost / qtyFilledTillNow : 0,
          fills,
          position,
        },
        placedInOrderbook: {
          totalQty: qty,
          openOrderqty: qty - qtyFilledTillNow,
        },
      };
    }
  }
}

function matchSellOrder() {} // will write it now once my BuyOrder is good.

function updateBalance() {} // I think this is now not needed as we are handling balances with releaseExcessMargin n balanceChecknLock fn

function releaseExcessMargin(
  userId: string,
  lockedPrice: bigint, // price at which margin was locked
  fillPrice: bigint, // actual execution price
  fillQty: bigint,
  leverage: number,
  market: string
) {
  const lockedMargin = calMarginToLock(lockedPrice, fillQty, leverage);
  const actualMargin = calMarginToLock(fillPrice, fillQty, leverage);
  const excess = lockedMargin - actualMargin;

  const quote = getQuoteAsset(market);
  const userBalance = balances.get(userId)!.get(quote)!;

  if (excess > 0n) {
    userBalance.locked -= excess;
  }
}

function placeOrderInOrderbook(
  orderId: string,
  userId: string,
  orderSide: "buy" | "sell",
  market: string,
  qty: bigint,
  maxPrice: bigint,
  leverage: number
) {
  const newOrder: OpenOrder = {
    originalOrderId: orderId,
    userId,
    side: orderSide,
    type: "limit",
    market,
    qty: qty,
    filledQty: 0n,
    price: maxPrice,
    leverage,
  };
  const side = orderSide === "buy" ? "bids" : "asks";

  const level = ORDER_BOOKS.get(market)![side].get(maxPrice);
  if (!level) {
    ORDER_BOOKS.get(market)![side].set(maxPrice, {
      availableQty: qty,
      openOrders: [newOrder],
    });
  } else {
    ((level.availableQty += qty), level.openOrders.push(newOrder));
  }
}

function balanceChecknLock(
  userId: string,
  market: string,
  maxPrice: bigint,
  qty: bigint,
  leverage: number
) {
  const quote = getQuoteAsset(market);
  const userBalance = balances.get(userId)!.get(quote);
  if (!userBalance) {
    return {
      success: false,
      error: `User doesnot have ${market} balance`,
    };
  }
  const availBalance = userBalance.total - userBalance.locked;

  const marginToLock = calMarginToLock(maxPrice, qty, leverage);

  if (availBalance < marginToLock) {
    return {
      success: false,
      error: `User doesnot have enough ${market} balance`,
    };
  }

  // lock the balance with maxPrice
  userBalance.locked += marginToLock;
  return {
    success: true,
  };
}

function getQuoteAsset(market: string) {
  const quote = market.split("-")[1];
  if (!quote) throw new Error(`Invalid market format: ${market}`);
  return quote;
}

// how are you handling this case. use has a long order, n places a short in the same market. where are you netting the users order ?
