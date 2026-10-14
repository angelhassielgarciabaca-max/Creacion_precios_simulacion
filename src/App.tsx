import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CandlestickChart } from './components/CandlestickChart';
import { DepthChart } from './components/DepthChart';
import { OrderBookTable } from './components/OrderBookTable';
import { OrderForm } from './components/OrderForm';
import { MonteCarloView } from './components/MonteCarloView';
import { TheoryGuide } from './components/TheoryGuide';
import { StreamlitCodeViewer } from './components/StreamlitCodeViewer';
import { generateInitialCandles, generateOrderBook, processOrderExecution } from './utils/marketEngine';
import { Candle, OrderBookLevel, Trade } from './types/market';
import { APP_PY_CODE, REQUIREMENTS_TXT } from './data/pythonCode';

export default function App() {
  const [activeTab, setActiveTab] = useState<'market' | 'montecarlo' | 'theory' | 'streamlit'>('market');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [currentPrice, setCurrentPrice] = useState<number>(100.00);
  const [initialPrice] = useState<number>(100.00);
  const [frozenS0, setFrozenS0] = useState<number>(100.00);

  const [candles, setCandles] = useState<Candle[]>(() => generateInitialCandles(100.00));
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }>(() =>
    generateOrderBook(100.00)
  );

  const [trades, setTrades] = useState<Trade[]>([
    {
      id: 'init-1',
      time: new Date(Date.now() - 6000).toLocaleTimeString(),
      side: 'BUY',
      price: 100.05,
      qty: 150,
      orderType: 'MARKET'
    },
    {
      id: 'init-2',
      time: new Date(Date.now() - 3000).toLocaleTimeString(),
      side: 'SELL',
      price: 99.95,
      qty: 80,
      orderType: 'LIMIT'
    }
  ]);

  // Keep ref of isPaused for timer loop
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const currentPriceRef = useRef(currentPrice);
  currentPriceRef.current = currentPrice;

  // Toggle Pause handler: freezes S0
  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        // Freezing S0
        setFrozenS0(currentPriceRef.current);
      }
      return next;
    });
  };

  // Manual Tick generator
  const handleManualTick = () => {
    if (isPausedRef.current) return;
    const delta = (Math.random() - 0.49) * 0.12;
    const nextPrice = Math.max(10, Math.round((currentPriceRef.current + delta) * 100) / 100);
    setCurrentPrice(nextPrice);
    setOrderBook(generateOrderBook(nextPrice));

    // Update candle
    setCandles((prevCandles) => {
      const last = prevCandles[prevCandles.length - 1];
      const newCandle: Candle = {
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        open: last.close,
        close: nextPrice,
        high: Math.round(Math.max(last.close, nextPrice) * 100 + Math.random() * 15) / 100,
        low: Math.round(Math.min(last.close, nextPrice) * 100 - Math.random() * 15) / 100,
        volume: Math.floor(100 + Math.random() * 300)
      };
      return [...prevCandles.slice(-49), newCandle];
    });
  };

  // Automated Market Maker Loop (every 2.8 seconds when not paused)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPausedRef.current) {
        handleManualTick();
      }
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  // Public Order Execution Handler
  const handleExecuteOrder = (
    side: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT',
    qty: number,
    limitPrice?: number
  ) => {
    const execution = processOrderExecution(
      side,
      orderType,
      qty,
      limitPrice,
      currentPrice,
      orderBook
    );

    setCurrentPrice(execution.newPrice);
    setOrderBook(execution.newBook);
    setTrades((prev) => [execution.trade, ...prev.slice(0, 25)]);

    // Update candle with new price
    setCandles((prevCandles) => {
      const last = prevCandles[prevCandles.length - 1];
      const newCandle: Candle = {
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        open: last.close,
        close: execution.newPrice,
        high: Math.max(last.high, execution.newPrice),
        low: Math.min(last.low, execution.newPrice),
        volume: last.volume + qty
      };
      return [...prevCandles.slice(0, -1), newCandle];
    });
  };

  const bestBid = orderBook.bids[0]?.price || currentPrice - 0.05;
  const bestAsk = orderBook.asks[0]?.price || currentPrice + 0.05;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Header & Ticker Bar */}
      <Header
        currentPrice={currentPrice}
        initialPrice={initialPrice}
        bestBid={bestBid}
        bestAsk={bestAsk}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onManualTick={handleManualTick}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 8 columns: Candlestick Chart + Depth Chart */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <CandlestickChart candles={candles} currentPrice={currentPrice} />
              <DepthChart bids={orderBook.bids} asks={orderBook.asks} currentPrice={currentPrice} />
            </div>

            {/* Right 4 columns: Public Participation Form + Order Book L2 + Tape */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <OrderForm
                currentPrice={currentPrice}
                bestBid={bestBid}
                bestAsk={bestAsk}
                isPaused={isPaused}
                onExecuteOrder={handleExecuteOrder}
              />
              <OrderBookTable
                bids={orderBook.bids}
                asks={orderBook.asks}
                trades={trades}
                currentPrice={currentPrice}
              />
            </div>
          </div>
        )}

        {activeTab === 'montecarlo' && (
          <MonteCarloView
            frozenS0={isPaused ? frozenS0 : currentPrice}
            isPaused={isPaused}
            onPauseMarket={handleTogglePause}
          />
        )}

        {activeTab === 'theory' && <TheoryGuide />}

        {activeTab === 'streamlit' && (
          <StreamlitCodeViewer
            appPyCode={APP_PY_CODE}
            requirementsTxt={REQUIREMENTS_TXT}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500 font-mono">
        QuantMarket Terminal & Monte Carlo Simulator • Finanzas Cuantitativas & Microestructura de Mercado
      </footer>
    </div>
  );
}
