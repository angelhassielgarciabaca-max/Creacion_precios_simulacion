import React from 'react';
import { OrderBookLevel, Trade } from '../types/market';
import { Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface OrderBookTableProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  trades: Trade[];
  currentPrice: number;
}

export const OrderBookTable: React.FC<OrderBookTableProps> = ({
  bids,
  asks,
  trades,
  currentPrice
}) => {
  const maxBidVol = Math.max(...bids.map(b => b.volume), 1);
  const maxAskVol = Math.max(...asks.map(a => a.volume), 1);
  const maxVol = Math.max(maxBidVol, maxAskVol);

  // Take top 7 levels
  const topAsks = [...asks].sort((a, b) => b.price - a.price).slice(-7);
  const topBids = [...bids].sort((a, b) => b.price - a.price).slice(0, 7);

  return (
    <div className="flex flex-col gap-3">
      {/* Level 2 Order Book */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
        <div className="flex items-center justify-between text-xs font-mono pb-2 mb-2 border-b border-slate-800">
          <span className="font-semibold text-slate-300">LIBRO DE ÓRDENES (L2)</span>
          <span className="text-[10px] text-slate-500">Volumen & Bloques</span>
        </div>

        <div className="text-[11px] font-mono select-none">
          {/* Header */}
          <div className="grid grid-cols-3 text-slate-400 pb-1 px-1 border-b border-slate-800/60 text-[10px] uppercase">
            <span>Precio ($)</span>
            <span className="text-right">Tamaño</span>
            <span className="text-right">Bloque</span>
          </div>

          {/* ASKS (Sellers) in descending price order */}
          <div className="flex flex-col gap-0.5 py-1">
            {topAsks.map((ask) => {
              const widthPct = (ask.volume / maxVol) * 100;
              return (
                <div
                  key={`ask-${ask.price}`}
                  className="grid grid-cols-3 items-center px-1 py-0.5 rounded relative overflow-hidden group hover:bg-slate-800/40 transition"
                >
                  {/* Background Depth Fill */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${widthPct}%` }}
                  />

                  <span className="text-rose-400 font-bold z-10">
                    ${ask.price.toFixed(2)}
                  </span>
                  <span className="text-right text-slate-200 z-10">
                    {ask.volume}
                  </span>
                  <div className="text-right z-10">
                    {ask.isBlock ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[9px] font-bold">
                        <Shield className="w-2.5 h-2.5" /> MURO
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SPREAD DIVIDER / CURRENT SPOT */}
          <div className="my-1 py-1 px-2 rounded bg-slate-950 border-y border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">Spread: ${Math.max(0.01, (topAsks[topAsks.length - 1]?.price || currentPrice) - (topBids[0]?.price || currentPrice)).toFixed(2)}</span>
            <span className="text-cyan-400 font-mono text-sm">
              Spot: ${currentPrice.toFixed(2)}
            </span>
          </div>

          {/* BIDS (Buyers) in descending price order */}
          <div className="flex flex-col gap-0.5 py-1">
            {topBids.map((bid) => {
              const widthPct = (bid.volume / maxVol) * 100;
              return (
                <div
                  key={`bid-${bid.price}`}
                  className="grid grid-cols-3 items-center px-1 py-0.5 rounded relative overflow-hidden group hover:bg-slate-800/40 transition"
                >
                  {/* Background Depth Fill */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${widthPct}%` }}
                  />

                  <span className="text-emerald-400 font-bold z-10">
                    ${bid.price.toFixed(2)}
                  </span>
                  <span className="text-right text-slate-200 z-10">
                    {bid.volume}
                  </span>
                  <div className="text-right z-10">
                    {bid.isBlock ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[9px] font-bold">
                        <Shield className="w-2.5 h-2.5" /> SOPORTE
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time & Sales (Live Tape) */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3">
        <div className="flex items-center justify-between text-xs font-mono pb-1.5 mb-1.5 border-b border-slate-800">
          <span className="font-semibold text-slate-300">CINTA DE OPERACIONES (TAPE)</span>
          <span className="text-[10px] text-slate-500">Últimos Trades</span>
        </div>

        <div className="flex flex-col gap-1 max-h-44 overflow-y-auto scrollbar-thin text-[11px] font-mono">
          {trades.map((t) => {
            const isBuy = t.side === 'BUY';
            return (
              <div
                key={t.id}
                className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-950/40 border border-slate-800/40"
              >
                <div className="flex items-center gap-1.5">
                  {isBuy ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span className={isBuy ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {t.side}
                  </span>
                  <span className="text-[10px] text-slate-500">{t.orderType}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-bold">${t.price.toFixed(2)}</span>
                  <span className="text-slate-400 text-[10px]">({t.qty} u.)</span>
                  <span className="text-slate-500 text-[9px]">{t.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
