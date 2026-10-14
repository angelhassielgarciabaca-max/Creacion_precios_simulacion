import React from 'react';
import { OrderBookLevel } from '../types/market';
import { Layers } from 'lucide-react';

interface DepthChartProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  currentPrice: number;
}

export const DepthChart: React.FC<DepthChartProps> = ({ bids, asks, currentPrice }) => {
  // Sort properly: bids descending, asks ascending
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);

  // Compute cumulative depth
  let cumBid = 0;
  const bidPoints = sortedBids.map(b => {
    cumBid += b.volume;
    return { ...b, cumVolume: cumBid };
  });

  let cumAsk = 0;
  const askPoints = sortedAsks.map(a => {
    cumAsk += a.volume;
    return { ...a, cumVolume: cumAsk };
  });

  const maxCumVol = Math.max(cumBid, cumAsk, 100);

  // Scale bounds
  const minBidPrice = sortedBids.length > 0 ? sortedBids[sortedBids.length - 1].price : currentPrice - 0.5;
  const maxAskPrice = sortedAsks.length > 0 ? sortedAsks[sortedAsks.length - 1].price : currentPrice + 0.5;
  const totalSpan = Math.max(0.2, maxAskPrice - minBidPrice);

  const width = 600;
  const height = 240;
  const midX = width / 2;

  // Build SVG polygon paths
  // Bids on the left side
  const bidPathPoints = bidPoints.map((bp) => {
    // x from minBidPrice to currentPrice
    const xPct = (bp.price - minBidPrice) / (currentPrice - minBidPrice || 0.1);
    const x = 30 + xPct * (midX - 35);
    const y = height - 25 - (bp.cumVolume / maxCumVol) * (height - 50);
    return { x, y, price: bp.price, cum: bp.cumVolume, isBlock: bp.isBlock, vol: bp.volume };
  });

  // Asks on the right side
  const askPathPoints = askPoints.map((ap) => {
    const xPct = (ap.price - currentPrice) / (maxAskPrice - currentPrice || 0.1);
    const x = midX + 5 + xPct * (midX - 35);
    const y = height - 25 - (ap.cumVolume / maxCumVol) * (height - 50);
    return { x, y, price: ap.price, cum: ap.cumVolume, isBlock: ap.isBlock, vol: ap.volume };
  });

  const bidSvgD = bidPathPoints.length > 0
    ? `M 30,${height - 25} ` +
      bidPathPoints.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${midX - 5},${height - 25} Z`
    : '';

  const askSvgD = askPathPoints.length > 0
    ? `M ${midX + 5},${height - 25} ` +
      askPathPoints.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${width - 10},${height - 25} Z`
    : '';

  // Identify Institutional Blocks
  const blockBids = bidPathPoints.filter(p => p.isBlock);
  const blockAsks = askPathPoints.filter(p => p.isBlock);

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 flex flex-col">
      <div className="flex items-center justify-between text-xs font-mono pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">PROFUNDIDAD & BLOQUES DE LIQUIDEZ</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500" />
            Bids ({cumBid} u.)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500" />
            Asks ({cumAsk} u.)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Bloque Institucional
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Baseline */}
          <line x1="20" y1={height - 25} x2={width - 10} y2={height - 25} stroke="#334155" />

          {/* Mid Price Dashed Line */}
          <line x1={midX} y1="10" x2={midX} y2={height - 25} stroke="#64748b" strokeDasharray="3,3" />
          <rect x={midX - 35} y="4" width="70" height="18" fill="#0f172a" stroke="#334155" rx="3" />
          <text x={midX} y="16.5" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            ${currentPrice.toFixed(2)}
          </text>

          {/* Bid Area */}
          {bidSvgD && (
            <path
              d={bidSvgD}
              fill="rgba(16, 185, 129, 0.22)"
              stroke="#10b981"
              strokeWidth="2"
            />
          )}

          {/* Ask Area */}
          {askSvgD && (
            <path
              d={askSvgD}
              fill="rgba(244, 63, 94, 0.22)"
              stroke="#f43f5e"
              strokeWidth="2"
            />
          )}

          {/* Liquidity Block Pins (Whales) */}
          {blockBids.map((b, i) => (
            <g key={`bb-${i}`}>
              <line x1={b.x} y1={b.y} x2={b.x} y2={height - 25} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2,2" />
              <circle cx={b.x} cy={b.y} r="5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
              <rect x={b.x - 45} y={Math.max(25, b.y - 28)} width="90" height="20" rx="3" fill="#1e1b4b" stroke="#f59e0b" />
              <text x={b.x} y={Math.max(25, b.y - 28) + 13} fill="#fef08a" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                🧱 Soporte {b.vol}u
              </text>
            </g>
          ))}

          {blockAsks.map((a, i) => (
            <g key={`ba-${i}`}>
              <line x1={a.x} y1={a.y} x2={a.x} y2={height - 25} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2,2" />
              <circle cx={a.x} cy={a.y} r="5" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
              <rect x={a.x - 45} y={Math.max(25, a.y - 28)} width="90" height="20" rx="3" fill="#1e1b4b" stroke="#f59e0b" />
              <text x={a.x} y={Math.max(25, a.y - 28) + 13} fill="#fef08a" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                🧱 Muro {a.vol}u
              </text>
            </g>
          ))}

          {/* Price axis labels */}
          <text x="30" y={height - 8} fill="#94a3b8" fontSize="9" fontFamily="monospace">
            ${minBidPrice.toFixed(2)}
          </text>
          <text x={width - 15} y={height - 8} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
            ${maxAskPrice.toFixed(2)}
          </text>
        </svg>
      </div>

      <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/60 flex items-center justify-between">
        <span>💡 <strong>Estructura de Mercado:</strong> Las órdenes límite acumuladas forman "paredes" de liquidez. Si una orden de mercado es superior al volumen de la pared, rompe el nivel.</span>
      </div>
    </div>
  );
};
