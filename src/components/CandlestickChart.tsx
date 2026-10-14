import React, { useState } from 'react';
import { Candle } from '../types/market';

interface CandlestickChartProps {
  candles: Candle[];
  currentPrice: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ candles, currentPrice }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!candles || candles.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500">Cargando gráfico de velas...</div>;
  }

  // Calculate scales
  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices) * 0.999;
  const maxPrice = Math.max(...prices) * 1.001;
  const priceRange = Math.max(0.2, maxPrice - minPrice);

  const maxVolume = Math.max(...candles.map(c => c.volume), 100);

  const width = 640;
  const height = 300;
  const priceHeight = height * 0.75;
  const volHeight = height * 0.22;
  const gap = height * 0.03;

  const candleWidth = Math.max(4, Math.min(16, (width - 40) / candles.length - 2));

  // Compute 9-period Simple Moving Average
  const smaPeriod = 9;
  const smaPoints: { x: number; y: number }[] = [];
  for (let i = smaPeriod - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < smaPeriod; j++) {
      sum += candles[i - j].close;
    }
    const avg = sum / smaPeriod;
    const x = 30 + i * (candleWidth + 2) + candleWidth / 2;
    const y = priceHeight - ((avg - minPrice) / priceRange) * priceHeight;
    smaPoints.push({ x, y });
  }

  const smaPath = smaPoints.length > 1
    ? `M ${smaPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';

  const activeCandle = hoverIndex !== null && candles[hoverIndex] ? candles[hoverIndex] : candles[candles.length - 1];

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 flex flex-col">
      {/* Top Header with live candle details */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono pb-2 mb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">VELAS EN VIVO</span>
          <span className="text-[11px] text-slate-500">Intervalo 3s</span>
          <span className="text-amber-400 text-[11px] flex items-center gap-1">
            <span className="w-2 h-0.5 bg-amber-400 inline-block" /> SMA(9)
          </span>
        </div>

        {activeCandle && (
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">O: <strong className="text-slate-200">${activeCandle.open.toFixed(2)}</strong></span>
            <span className="text-slate-400">H: <strong className="text-slate-200">${activeCandle.high.toFixed(2)}</strong></span>
            <span className="text-slate-400">L: <strong className="text-slate-200">${activeCandle.low.toFixed(2)}</strong></span>
            <span className="text-slate-400">C: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>${activeCandle.close.toFixed(2)}</strong></span>
            <span className="text-slate-400">Vol: <strong className="text-slate-200">{activeCandle.volume}</strong></span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Gridlines */}
          {[0.2, 0.4, 0.6, 0.8].map(ratio => {
            const y = priceHeight * ratio;
            const pVal = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line x1="30" y1={y} x2={width - 10} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                <text x="25" y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                  ${pVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Volume Separator */}
          <line x1="30" y1={priceHeight + gap / 2} x2={width - 10} y2={priceHeight + gap / 2} stroke="#334155" />
          <text x="25" y={priceHeight + gap + 10} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
            VOL
          </text>

          {/* Candlesticks & Volume bars */}
          {candles.map((candle, idx) => {
            const x = 30 + idx * (candleWidth + 2);
            const isBull = candle.close >= candle.open;
            const color = isBull ? '#10b981' : '#f43f5e';

            // Prices scaled
            const yHigh = priceHeight - ((candle.high - minPrice) / priceRange) * priceHeight;
            const yLow = priceHeight - ((candle.low - minPrice) / priceRange) * priceHeight;
            const yOpen = priceHeight - ((candle.open - minPrice) / priceRange) * priceHeight;
            const yClose = priceHeight - ((candle.close - minPrice) / priceRange) * priceHeight;

            const yTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

            // Volume bar
            const vHeight = (candle.volume / maxVolume) * volHeight;
            const vY = height - vHeight;

            const isHovered = hoverIndex === idx;

            return (
              <g
                key={candle.timestamp || idx}
                onMouseEnter={() => setHoverIndex(idx)}
                className="cursor-crosshair"
              >
                {/* Wick */}
                <line
                  x1={x + candleWidth / 2}
                  y1={yHigh}
                  x2={x + candleWidth / 2}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1.2"
                />

                {/* Body */}
                <rect
                  x={x}
                  y={yTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx="1"
                  opacity={isHovered ? 1 : 0.9}
                />

                {/* Volume bar */}
                <rect
                  x={x}
                  y={vY}
                  width={candleWidth}
                  height={vHeight}
                  fill={color}
                  opacity={isHovered ? 0.9 : 0.45}
                  rx="1"
                />

                {/* Vertical hover line */}
                {isHovered && (
                  <line
                    x1={x + candleWidth / 2}
                    y1="0"
                    x2={x + candleWidth / 2}
                    y2={height}
                    stroke="#38bdf8"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}

          {/* SMA Line */}
          {smaPath && (
            <path
              d={smaPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.8"
              opacity="0.85"
            />
          )}

          {/* Current Spot Price Line */}
          {(() => {
            const currentY = priceHeight - ((currentPrice - minPrice) / priceRange) * priceHeight;
            if (currentY >= 0 && currentY <= priceHeight) {
              return (
                <g>
                  <line
                    x1="30"
                    y1={currentY}
                    x2={width - 50}
                    y2={currentY}
                    stroke="#38bdf8"
                    strokeDasharray="2,2"
                    strokeWidth="1.2"
                  />
                  <rect
                    x={width - 48}
                    y={currentY - 8}
                    width="44"
                    height="16"
                    fill="#0284c7"
                    rx="3"
                  />
                  <text
                    x={width - 26}
                    y={currentY + 3.5}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    ${currentPrice.toFixed(2)}
                  </text>
                </g>
              );
            }
            return null;
          })()}
        </svg>
      </div>
    </div>
  );
};
