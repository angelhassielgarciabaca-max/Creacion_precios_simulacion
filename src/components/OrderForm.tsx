import React, { useState } from 'react';
import { Send, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react';

interface OrderFormProps {
  currentPrice: number;
  bestBid: number;
  bestAsk: number;
  isPaused: boolean;
  onExecuteOrder: (side: 'BUY' | 'SELL', orderType: 'MARKET' | 'LIMIT', qty: number, limitPrice?: number) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  currentPrice,
  bestBid,
  bestAsk,
  isPaused,
  onExecuteOrder
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState<number>(200);
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice);
  const [lastNotice, setLastNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaused) return;

    onExecuteOrder(side, orderType, quantity, orderType === 'LIMIT' ? limitPrice : undefined);
    setLastNotice(`Orden ${side} ${orderType} de ${quantity} u. enviada`);
    setTimeout(() => setLastNotice(null), 3000);
  };

  const isBuy = side === 'BUY';
  const notional = (orderType === 'LIMIT' ? limitPrice : currentPrice) * quantity;

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 flex flex-col gap-3 font-mono">
      {/* Title */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
        <span className="font-semibold text-slate-300">📱 PARTICIPACIÓN DEL PÚBLICO</span>
        <span className="text-[10px] text-slate-500">Envío de Órdenes</span>
      </div>

      {isPaused && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>El mercado está pausado. Reanuda arriba para enviar órdenes en vivo.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
        {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              isBuy
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            COMPRAR (Bid)
          </button>

          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              !isBuy
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-1 ring-rose-400'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            VENDER (Ask)
          </button>
        </div>

        {/* Order Type Selector */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setOrderType('MARKET')}
            className={`py-1.5 px-2 rounded-md font-semibold transition text-center ${
              orderType === 'MARKET'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300'
            }`}
          >
            MERCADO (Inmediata)
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType('LIMIT');
              setLimitPrice(isBuy ? bestBid : bestAsk);
            }}
            className={`py-1.5 px-2 rounded-md font-semibold transition text-center ${
              orderType === 'LIMIT'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300'
            }`}
          >
            LÍMITE (Libro / Pasiva)
          </button>
        </div>

        {/* Limit Price Input if LIMIT */}
        {orderType === 'LIMIT' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 flex justify-between">
              <span>Precio Límite ($)</span>
              <span className="text-cyan-400">Ref: ${currentPrice.toFixed(2)}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLimitPrice(prev => Math.max(0.01, +(prev - 0.05).toFixed(2)))}
                className="px-2 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
              >
                -$0.05
              </button>
              <input
                type="number"
                step="0.05"
                min="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-center text-white font-mono focus:border-cyan-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setLimitPrice(prev => +(prev + 0.05).toFixed(2))}
                className="px-2 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
              >
                +$0.05
              </button>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 flex justify-between">
            <span>Cantidad de Acciones</span>
            <span className="text-slate-300">{quantity} u.</span>
          </label>
          <input
            type="range"
            min="10"
            max="1500"
            step="10"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />

          {/* Quick presets */}
          <div className="flex gap-1.5 justify-between">
            {[50, 100, 250, 500, 1000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuantity(preset)}
                className={`flex-1 py-0.5 rounded text-[10px] transition ${
                  quantity === preset
                    ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Notional value & estimated impact */}
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 text-[11px] flex flex-col gap-1">
          <div className="flex justify-between text-slate-400">
            <span>Valor Nocional:</span>
            <strong className="text-white">${notional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Tipo de Impacto:</span>
            <span className={quantity >= 400 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
              {quantity >= 400 ? '⚠️ Impacto Institucional (Bloque)' : 'Flujo Minorista Estándar'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isPaused}
          className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${
            isBuy
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>
            {isBuy ? 'Ejecutar COMPRA' : 'Ejecutar VENTA'} (${notional.toFixed(0)})
          </span>
        </button>

        {lastNotice && (
          <div className="text-center text-[10px] text-cyan-400 bg-cyan-950/40 p-1.5 rounded border border-cyan-800/40 animate-fade-in">
            {lastNotice}
          </div>
        )}
      </form>
    </div>
  );
};
