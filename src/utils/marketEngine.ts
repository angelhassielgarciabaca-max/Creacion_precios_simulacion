import { Candle, OrderBookLevel, Trade } from '../types/market';

/**
 * Generates an initial realistic candle history (30 candles)
 */
export function generateInitialCandles(startPrice = 100.0): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;
  const now = Date.now();

  for (let i = 29; i >= 0; i--) {
    const timestamp = now - i * 3000;
    const timeStr = new Date(timestamp).toLocaleTimeString();
    const open = price;
    const delta = (Math.random() - 0.49) * 0.4;
    const close = Math.round((open + delta) * 100) / 100;
    const high = Math.round((Math.max(open, close) + Math.random() * 0.25) * 100) / 100;
    const low = Math.round((Math.min(open, close) - Math.random() * 0.25) * 100) / 100;
    const volume = Math.floor(100 + Math.random() * 400);

    candles.push({
      time: timeStr,
      timestamp,
      open,
      high,
      low,
      close,
      volume
    });
    price = close;
  }
  return candles;
}

/**
 * Generates Level 2 Order Book with automatic Market Makers and Institutional Liquidity Blocks
 */
export function generateOrderBook(midPrice: number): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  // Pick index for institutional liquidity blocks (e.g. index 3 or 5)
  const specialBidIdx = 3;
  const specialAskIdx = 4;

  let cumBidVol = 0;
  let cumAskVol = 0;

  for (let i = 1; i <= 10; i++) {
    const bidPrice = Math.round((midPrice - i * 0.05) * 100) / 100;
    const askPrice = Math.round((midPrice + i * 0.05) * 100) / 100;

    let bidVol = Math.floor(80 + Math.random() * 120);
    let askVol = Math.floor(80 + Math.random() * 120);

    const isBidBlock = i === specialBidIdx;
    const isAskBlock = i === specialAskIdx;

    if (isBidBlock) {
      bidVol = Math.floor(800 + Math.random() * 600); // 10x institutional block
    }
    if (isAskBlock) {
      askVol = Math.floor(850 + Math.random() * 600); // 10x institutional block
    }

    cumBidVol += bidVol;
    cumAskVol += askVol;

    bids.push({
      price: bidPrice,
      volume: bidVol,
      total: cumBidVol,
      isBlock: isBidBlock
    });

    asks.push({
      price: askPrice,
      volume: askVol,
      total: cumAskVol,
      isBlock: isAskBlock
    });
  }

  return { bids, asks };
}

/**
 * Simulates a trade execution against the Order Book
 */
export function processOrderExecution(
  side: 'BUY' | 'SELL',
  orderType: 'MARKET' | 'LIMIT',
  qty: number,
  limitPrice: number | undefined,
  currentPrice: number,
  orderBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }
): {
  newPrice: number;
  newBook: { bids: OrderBookLevel[]; asks: OrderBookLevel[] };
  trade: Trade;
  message: string;
} {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const tradeId = Math.random().toString(36).substring(2, 9);
  let newPrice = currentPrice;
  const bids = [...orderBook.bids];
  const asks = [...orderBook.asks];

  if (orderType === 'MARKET') {
    if (side === 'BUY') {
      // Eats from lowest ask up
      let remaining = qty;
      let executedAt = asks[0]?.price || currentPrice;

      for (let i = 0; i < asks.length && remaining > 0; i++) {
        executedAt = asks[i].price;
        if (asks[i].volume <= remaining) {
          remaining -= asks[i].volume;
          asks[i].volume = 0;
        } else {
          asks[i].volume -= remaining;
          remaining = 0;
        }
      }

      // Filter empty asks or refresh
      newPrice = executedAt;
      const trade: Trade = {
        id: tradeId,
        time: timeStr,
        side: 'BUY',
        price: newPrice,
        qty,
        orderType: 'MARKET'
      };

      return {
        newPrice,
        newBook: generateOrderBook(newPrice),
        trade,
        message: `Orden de Compra ejecutada a mercado por ${qty} u. a un precio promedio de $${newPrice.toFixed(2)}`
      };
    } else {
      // SELL: Eats from highest bid down
      let remaining = qty;
      let executedAt = bids[0]?.price || currentPrice;

      for (let i = 0; i < bids.length && remaining > 0; i++) {
        executedAt = bids[i].price;
        if (bids[i].volume <= remaining) {
          remaining -= bids[i].volume;
          bids[i].volume = 0;
        } else {
          bids[i].volume -= remaining;
          remaining = 0;
        }
      }

      newPrice = executedAt;
      const trade: Trade = {
        id: tradeId,
        time: timeStr,
        side: 'SELL',
        price: newPrice,
        qty,
        orderType: 'MARKET'
      };

      return {
        newPrice,
        newBook: generateOrderBook(newPrice),
        trade,
        message: `Orden de Venta ejecutada a mercado por ${qty} u. a un precio promedio de $${newPrice.toFixed(2)}`
      };
    }
  } else {
    // LIMIT ORDER
    const targetPx = limitPrice ?? currentPrice;
    const isBlock = qty >= 400;

    if (side === 'BUY') {
      const bestAsk = asks[0]?.price ?? Infinity;
      if (targetPx >= bestAsk) {
        // Crosses spread => executes as market
        return processOrderExecution('BUY', 'MARKET', qty, undefined, currentPrice, orderBook);
      }
      // Insert into bids
      const existing = bids.find(b => Math.abs(b.price - targetPx) < 0.025);
      if (existing) {
        existing.volume += qty;
        if (qty > 400) existing.isBlock = true;
      } else {
        bids.push({ price: targetPx, volume: qty, isBlock });
        bids.sort((a, b) => b.price - a.price);
      }
    } else {
      const bestBid = bids[0]?.price ?? 0;
      if (targetPx <= bestBid) {
        // Crosses spread => executes as market
        return processOrderExecution('SELL', 'MARKET', qty, undefined, currentPrice, orderBook);
      }
      const existing = asks.find(a => Math.abs(a.price - targetPx) < 0.025);
      if (existing) {
        existing.volume += qty;
        if (qty > 400) existing.isBlock = true;
      } else {
        asks.push({ price: targetPx, volume: qty, isBlock });
        asks.sort((a, b) => a.price - b.price);
      }
    }

    const trade: Trade = {
      id: tradeId,
      time: timeStr,
      side,
      price: targetPx,
      qty,
      orderType: 'LIMIT'
    };

    return {
      newPrice: currentPrice,
      newBook: { bids, asks },
      trade,
      message: `Orden Límite registrada en el libro: ${qty} u. a $${targetPx.toFixed(2)} ${isBlock ? '(Bloque Institucional Detectado)' : ''}`
    };
  }
}
