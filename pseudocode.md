function updatePosition(
userId, market, orderSide, fillQty, fillPrice, leverage
) {
const existing = positions.get(userId, market)
newSide = orderSide === "buy" ? "long" : "short"

    if (!existing) {
        // create new position
        positions.set(userId, new Map().set(market, ({
            side = newSide,
            qty: fillQty,
            entryPrice: fillPrice
            leverage,
            margin: calculateMargin(fillQty, fillPrice, leverage),
            positionStatus: "open",
            createdAt: new Date.now()



        })))

        updateBalance() {

        }

    }


    if (existing.side === newSide) {
        // increase position
        existing.entryPrice = existing.fillPrice * existing.fillQty + fillPrice * fillQty / existing.fillQty + fillQty
        // isn't this oldPrice * oldQty + .........
        existing.qty += fillQty,

        existing.margin: existing.margin + calculateMargin(leverage, fillQty, fillPrice),




        existing.leverage // is there a scenario when leverage is diff n we create a diff position or how we handle it.

        updateBalance()

    } else {

        // reduce/ close/ flip

        const qtyToClose = Math.min(existing.fillQty, fillQty)

        let remainingQty = existing.fillQty - fillQty

        const direction = existing.side === "long" ? +1 : -1

        const realizedPnL = (fillPrice - existing.entryPrice) * qtyToClose  * direction

        // orderplace, locked, now profit/loss, unlock, locked + pnl
        userBalance.locked -= existing.margin / existing.qty * qtyToClose
        userBalance.total += realizedPnL,

        if (remainingQty === 0) {
            // close
            existing.qty = 0
            existing.entryPrice = 0,
            existing.margin = 0,
            existing.positionStatus = "closed",
            existing.updatedAt = new Date.now(),

        } else if (remainingQty > 0) {
            // reduce
            existing.margin -= existing.margin / existing.qty * fillQty,
            existing.qty -= fillQty,
            udpatedAt: new Date.now()

        } else if (remainingQty < 0) {
            // flip
            existing.positionSide: existing.position === "long" ? "short" : "long",
            existing.entryPrice: fillPrice,
            existing.leverage: // remains same,
            existing.margin: calculateMargin(fillPrice, remainingQty * -1, leverage),

            qty: remainingQty * -1,
            existing.updatedAt: ,
            // should I keep updating in case of position flip or should I createdAt as its a new opp position,
        }





    }

}

# The Matching loop

order -> buy/sell -> sell -> get orderbook -> sortedBids(desc)-> try to fill in with bestBids -> remainingQty -> (if limit) -> ordebook
! !
buy if (market)
! !
get orderbook -> sortedAsks(asc) cancel remaining
!
try to fill in with best asks (sell fills \*\* see 1)
!
remainingToBefilled
!
if market order -> cancel the remaining
!
if limit order
!
sit in the orderbook

let requiredQty = buyorder.qty

1 -> sortedAsks -> for each price level {
// there will be multiple open orders at the same price
iterate through each order (always sorted based on time)
then keep filling them until requiredQty === 0

    const orders = orders at this price level
    const price = this price level

    if ( price > maxPrice/limitPrice ) {
        break;
    }

    for ( int i = 0; i < orders.length ; i++) {
        const order = orders[i]
        const filledInThisOrder = Math.min(requiredQty, order.qty)
        // we have filled, now updatePositions on both sides. maker n taker
        updatePosition(userId, market, "long", filledInThisOrder, price, leverage)
        updateBalance(userId, maxPrice, )


        updatePosition(makerUserId, market, "sell", filledInThisOrde, price, leverage )
        udpateBalance(makerUserId, maxPrice, filledInThisOrde, leverage, lockedPrice)

        Fill.push({
            market,
            makerId,
            takerId,
            side
            price,
            filledInThisOrder,
        })

        order.qty -= filledInThisOrder
        order.filledQty += filledInThisOrder
        price.availableQty -= filledInThisOrder


        requiredQty -= filledInThisOrder
        if (requiredQty === 0) break;
    }

    if (sortedAks(price).qty === 0) {
        // remove this price level from the orderbook completely.
        orderbook.asks.delete(price)
        continue;
    }

}

if ( requiredQty > 0) {
if ( order.type === "market") {
cancel the remaining qty
}
put the buy orde in the ordebook
const orderbook = orderbooks.get(market)
const ordersAtThisPrice = orderbook.bids.get(limitPrice)
if (!ordersAtThisPrice) {
orderbook.bids.set(limitPrice, {
availableQty: requiredQty,
orders: [newOrder]
})
} else {
ordersAtThisPrice.availableQty: += requiredQty,/
ordersAtThisPrice.openOrders.push({
userId,
side: "buy",
type: "limit",
market,
qty: requiredQty,
filledQty: 0,
price: limitPrice
})
}
}

return {
orderStatus: "rejected" | "partial" | "filled" | "open"

        orderId,
        filledDetails: {
          totalQty: qty,
          filledQty: qty - qtyFilledTillNow,
          avgPrice: totalCost / qty - qtyFilledTillNow,
          fills,
          positions: "",
        },
        placedInOrderbook: {
          totalQty: qty,
          openOrderqty: qty - qtyFilledTillNow,
        },
    // not sure if this is right or what to return n what not.

}
