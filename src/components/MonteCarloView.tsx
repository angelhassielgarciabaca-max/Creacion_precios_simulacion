import React, { useState, useEffect } from 'react';
import { MonteCarloResult } from '../types/market';
import { runMonteCarloSimulation } from '../utils/monteCarlo';
import { Play, Sparkles, TrendingUp, AlertOctagon, BarChart3, HelpCircle, Lock } from 'lucide-react';

interface MonteCarloViewProps {
  frozenS0: number;
  isPaused: boolean;
  onPauseMarket: () => void;
}

export const MonteCarloView: React.FC<MonteCarloViewProps> = ({
  frozenS0,
  isPaused,
  onPauseMarket
}) => {
  const [s0, setS0] = useState<number>(frozenS0);
  const [days, setDays] = useState<number>(63); // 3 months default
  const [volatility, setVolatility] = useState<number>(0.25); // 25%
  const [drift, setDrift] = useState<number>(0.08); // 8%
  const [numSimulations] = useState<number>(10000);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [results, setResults] = useState<MonteCarloResult | null>(null);
  const [hoverStep, setHoverStep] = useState<number | null>(null);
  const [showPaths, setShowPaths] = useState<boolean>(true);
  const [showBands, setShowBands] = useState<boolean>(true);

  // Sync s0 if frozen changes
  useEffect(() => {
    setS0(frozenS0);
  }, [frozenS0]);

  // Initial simulation run on load
  useEffect(() => {
    executeSimulation();
  }, []);

  const executeSimulation = () => {
    setIsComputing(true);
    setTimeout(() => {
      const res = runMonteCarloSimulation({
        s0,
        days,
        volatility,
        drift,
        numSimulations
      });
      setResults(res);
      setIsComputing(false);
    }, 40);
  };

  return (
    <div className="flex flex-col gap-5 font-mono">
      {/* Top Banner & Status */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>MÓDULO 3: SIMULACIÓN DE MONTE CARLO VECTORIZADA</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
              10,000 Trayectorias
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Implementación del Movimiento Geométrico Browniano (MGB) mediante la solución exacta de Itô. 
            Proyecta 10,000 caminos estocásticos simultáneos para análisis predictivo y gestión de riesgo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isPaused ? (
            <button
              onClick={onPauseMarket}
              className="px-3.5 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/50 hover:bg-rose-600/30 font-semibold text-xs flex items-center gap-2 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Pausar Mercado para Fijar S₀</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mercado Pausado • S₀ = ${s0.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel: Sliders & Parameters */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* S0 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Precio Inicial (S₀)</span>
            <span className="text-cyan-400 font-bold">${s0.toFixed(2)}</span>
          </div>
          <input
            type="number"
            step="0.5"
            min="1"
            value={s0}
            onChange={(e) => setS0(parseFloat(e.target.value) || 100)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono outline-none focus:border-cyan-500"
          />
          <span className="text-[10px] text-slate-500">Precio spot congelado</span>
        </div>

        {/* Days T */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Horizonte T (Días)</span>
            <span className="text-cyan-400 font-bold">{days} días</span>
          </div>
          <input
            type="range"
            min="10"
            max="252"
            step="1"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>10d (Corto)</span>
            <span>63d (Trimestre)</span>
            <span>252d (1 Año)</span>
          </div>
        </div>

        {/* Volatility */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Volatilidad Anual (σ)</span>
            <span className="text-amber-400 font-bold">{(volatility * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.20"
            step="0.01"
            value={volatility}
            onChange={(e) => setVolatility(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>5% (Bonos)</span>
            <span>25% (S&P 500)</span>
            <span>80% (Crypto/Tech)</span>
          </div>
        </div>

        {/* Drift */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Drift / Tasa Libre (μ)</span>
            <span className="text-emerald-400 font-bold">{(drift * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="-0.40"
            max="0.50"
            step="0.01"
            value={drift}
            onChange={(e) => setDrift(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-40% (Bajista)</span>
            <span>+8% (Histórico)</span>
            <span>+50% (Alcista)</span>
          </div>
        </div>

        {/* Run Button Span Full Width */}
        <div className="md:col-span-4 mt-2">
          <button
            onClick={executeSimulation}
            disabled={isComputing}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {isComputing ? 'Calculando 10,000 Trayectorias...' : 'Ejecutar 10,000 Simulaciones de Monte Carlo (Vectorizado)'}
            </span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {/* Expected Price */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">Precio Esperado E[S_T]</span>
              <div className="text-xl font-bold text-emerald-400">${results.meanFinal.toFixed(2)}</div>
              <span className="text-[11px] text-slate-400">
                Retorno: <strong className={results.meanFinal >= results.s0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {(((results.meanFinal - results.s0) / results.s0) * 100).toFixed(2)}%
                </strong>
              </span>
            </div>

            {/* Median Price */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">Mediana Final (P50)</span>
              <div className="text-xl font-bold text-cyan-400">${results.medianFinal.toFixed(2)}</div>
              <span className="text-[11px] text-slate-400">
                Desv. Est: ±${results.stdFinal.toFixed(2)}
              </span>
            </div>

            {/* Probability of Profit */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">Probabilidad Ganancia</span>
              <div className="text-xl font-bold text-amber-400">{results.probProfit.toFixed(1)}%</div>
              <span className="text-[11px] text-slate-400">P(S_T &gt; S₀)</span>
            </div>

            {/* VaR 95% */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">Value at Risk 95%</span>
              <div className="text-xl font-bold text-rose-400">-${results.var95LossDollar.toFixed(2)}</div>
              <span className="text-[11px] text-slate-400">
                Pérdida Máx: <strong className="text-rose-400">-{results.var95LossPct.toFixed(2)}%</strong>
              </span>
            </div>

            {/* CVaR 95% */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase">Conditional VaR (CVaR)</span>
              <div className="text-xl font-bold text-rose-300">-${results.cvarLossDollar.toFixed(2)}</div>
              <span className="text-[11px] text-slate-400">
                Expected Shortfall: -{results.cvarLossPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Charts Row: Fan Chart and Distribution Histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Fan Chart (Cono de Incertidumbre) */}
            <div className="lg:col-span-3 bg-gradient-to-b from-slate-900/90 to-slate-950/90 rounded-xl border border-slate-800/90 p-3.5 flex flex-col shadow-xl shadow-black/40">
              {/* Header with Title and Interactive Toggles */}
              <div className="flex flex-wrap items-center justify-between text-xs pb-2.5 mb-2.5 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-100 font-mono tracking-tight text-xs">
                      CONO DE INCERTIDUMBRE (10,000 TRAYECTORIAS)
                    </span>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      Proyección estocástica del Movimiento Geométrico Browniano
                    </span>
                  </div>
                </div>

                {/* View Toggles & Badges */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setShowPaths(prev => !prev)}
                    className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 font-mono ${
                      showPaths
                        ? 'bg-slate-800 text-cyan-300 border-cyan-700/60 shadow-sm'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${showPaths ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                    100 Trayectorias
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBands(prev => !prev)}
                    className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 font-mono ${
                      showBands
                        ? 'bg-slate-800 text-emerald-300 border-emerald-700/60 shadow-sm'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${showBands ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    Bandas [5%-95%]
                  </button>
                </div>
              </div>

              {/* Dynamic HUD Overlay for Hover inspection */}
              {hoverStep !== null && (
                <div className="mb-2 py-1.5 px-3 rounded-lg bg-slate-950/95 border border-cyan-500/40 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 shadow-lg shadow-cyan-950/40 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700 font-bold">
                      Día {hoverStep}
                    </span>
                    <span className="text-slate-400">
                      T: {(hoverStep / (results.timeGrid.length - 1 || 1) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      P95: <strong className="text-cyan-400">${results.percentile95[hoverStep]?.toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-400">
                      P50 (Mediana): <strong className="text-white">${results.percentile50[hoverStep]?.toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-400">
                      P5: <strong className="text-rose-400">${results.percentile5[hoverStep]?.toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-400 hidden sm:inline">
                      Amplitud: <strong className="text-amber-400">±${((results.percentile95[hoverStep] - results.percentile5[hoverStep]) / 2).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Enhanced Fan Chart SVG */}
              <div className="w-full relative group">
                {(() => {
                  const width = 640;
                  const height = 330;
                  const padding = { top: 22, right: 75, bottom: 32, left: 45 };

                  const steps = results.timeGrid.length - 1;
                  const minPrice = Math.min(...results.percentile5) * 0.95;
                  const maxPrice = Math.max(...results.percentile95) * 1.05;
                  const priceRange = maxPrice - minPrice || 1;

                  const xScale = (step: number) => padding.left + (step / steps) * (width - padding.left - padding.right);
                  const yScale = (p: number) => height - padding.bottom - ((p - minPrice) / priceRange) * (height - padding.top - padding.bottom);

                  // Area paths for 90% and 50% bands
                  const p95Points = results.percentile95.map((p, i) => `${xScale(i).toFixed(1)},${yScale(p).toFixed(1)}`);
                  const p5PointsReversed = results.percentile5.map((p, i) => `${xScale(i).toFixed(1)},${yScale(p).toFixed(1)}`).reverse();
                  const band90Path = `M ${p95Points.join(' L ')} L ${p5PointsReversed.join(' L ')} Z`;

                  const p75Points = results.percentile75.map((p, i) => `${xScale(i).toFixed(1)},${yScale(p).toFixed(1)}`);
                  const p25PointsReversed = results.percentile25.map((p, i) => `${xScale(i).toFixed(1)},${yScale(p).toFixed(1)}`).reverse();
                  const band50Path = `M ${p75Points.join(' L ')} L ${p25PointsReversed.join(' L ')} Z`;

                  const medianPoints = results.percentile50.map((p, i) => `${xScale(i).toFixed(1)},${yScale(p).toFixed(1)}`).join(' L ');

                  // Handle mouse movement to detect hovered step
                  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const xRel = ((e.clientX - rect.left) / rect.width) * width;
                    const chartX = Math.max(padding.left, Math.min(width - padding.right, xRel));
                    const currentStep = Math.round(((chartX - padding.left) / (width - padding.left - padding.right)) * steps);
                    setHoverStep(Math.max(0, Math.min(steps, currentStep)));
                  };

                  return (
                    <svg
                      viewBox={`0 0 ${width} ${height}`}
                      className="w-full h-auto select-none font-mono cursor-crosshair"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoverStep(null)}
                    >
                      <defs>
                        {/* 90% Confidence Band Gradient */}
                        <linearGradient id="fanBand90Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.12" />
                          <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.28" />
                        </linearGradient>

                        {/* 50% Interquartile Gradient */}
                        <linearGradient id="fanBand50Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
                          <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.45" />
                        </linearGradient>

                        {/* Neon Glow Filter */}
                        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Chart Background Accent */}
                      <rect
                        x={padding.left}
                        y={padding.top}
                        width={width - padding.left - padding.right}
                        height={height - padding.top - padding.bottom}
                        fill="#090d16"
                        rx="6"
                      />

                      {/* Horizontal Gridlines */}
                      {[0.15, 0.35, 0.55, 0.75, 0.95].map(ratio => {
                        const y = padding.top + ratio * (height - padding.top - padding.bottom);
                        const val = maxPrice - ratio * priceRange;
                        return (
                          <g key={ratio}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={width - padding.right}
                              y2={y}
                              stroke="#1e293b"
                              strokeDasharray="3,3"
                              strokeWidth="0.8"
                            />
                            <text
                              x={padding.left - 6}
                              y={y + 3.5}
                              fill="#64748b"
                              fontSize="9"
                              textAnchor="end"
                            >
                              ${val.toFixed(1)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Vertical timeline dividers */}
                      {[0.25, 0.5, 0.75].map(ratio => {
                        const s = Math.round(steps * ratio);
                        const x = xScale(s);
                        return (
                          <line
                            key={ratio}
                            x1={x}
                            y1={padding.top}
                            x2={x}
                            y2={height - padding.bottom}
                            stroke="#1e293b"
                            strokeDasharray="2,4"
                            strokeWidth="0.8"
                          />
                        );
                      })}

                      {/* 90% Confidence Band */}
                      {showBands && (
                        <path
                          d={band90Path}
                          fill="url(#fanBand90Grad)"
                          stroke="rgba(6, 182, 212, 0.4)"
                          strokeWidth="1"
                        />
                      )}

                      {/* 50% Interquartile Band */}
                      {showBands && (
                        <path
                          d={band50Path}
                          fill="url(#fanBand50Grad)"
                          stroke="rgba(56, 189, 248, 0.6)"
                          strokeWidth="1"
                        />
                      )}

                      {/* 100 Sample Stochastic Trajectories with Color Coding */}
                      {showPaths && results.samplePaths.map((path, idx) => {
                        const finalP = path[path.length - 1];
                        const isBullish = finalP >= results.s0;
                        const strokeColor = isBullish ? '#34d399' : '#f87171';
                        const opacity = isBullish ? 0.22 : 0.18;
                        const pathD = `M ${path.map((val, step) => `${xScale(step).toFixed(1)},${yScale(val).toFixed(1)}`).join(' L ')}`;

                        return (
                          <path
                            key={idx}
                            d={pathD}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="0.8"
                            opacity={opacity}
                          />
                        );
                      })}

                      {/* Initial Price Baseline S0 */}
                      <line
                        x1={padding.left}
                        y1={yScale(results.s0)}
                        x2={width - padding.right}
                        y2={yScale(results.s0)}
                        stroke="#94a3b8"
                        strokeDasharray="3,3"
                        strokeWidth="1.2"
                        opacity="0.8"
                      />

                      {/* S0 Left Label */}
                      <rect
                        x={padding.left + 4}
                        y={yScale(results.s0) - 8}
                        width="48"
                        height="16"
                        fill="#1e293b"
                        stroke="#475569"
                        rx="3"
                      />
                      <text
                        x={padding.left + 28}
                        y={yScale(results.s0) + 3.5}
                        fill="#e2e8f0"
                        fontSize="8.5"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        S₀=${results.s0.toFixed(0)}
                      </text>

                      {/* VaR 95% Horizontal Guide Line */}
                      <line
                        x1={padding.left}
                        y1={yScale(results.var95Price)}
                        x2={width - padding.right}
                        y2={yScale(results.var95Price)}
                        stroke="#f43f5e"
                        strokeDasharray="2,2"
                        strokeWidth="1.2"
                      />

                      {/* Median Path (P50) with Luminous Neon Double Stroke */}
                      <path
                        d={`M ${medianPoints}`}
                        fill="none"
                        stroke="rgba(56, 189, 248, 0.4)"
                        strokeWidth="6"
                      />
                      <path
                        d={`M ${medianPoints}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        filter="url(#neonGlow)"
                      />

                      {/* Terminal Endpoint Badges on the Right Edge at Day T */}
                      {(() => {
                        const xT = xScale(steps);
                        const yP95 = yScale(results.percentile95[steps]);
                        const yP50 = yScale(results.percentile50[steps]);
                        const yVaR = yScale(results.var95Price);
                        const yP5 = yScale(results.percentile5[steps]);

                        return (
                          <g>
                            {/* P95 Endpoint Badge */}
                            <line x1={xT} y1={yP95} x2={xT + 6} y2={yP95} stroke="#06b6d4" strokeWidth="1.5" />
                            <circle cx={xT} cy={yP95} r="3" fill="#06b6d4" />
                            <rect x={xT + 6} y={yP95 - 8} width="62" height="16" rx="3" fill="#083344" stroke="#06b6d4" strokeWidth="0.8" />
                            <text x={xT + 37} y={yP95 + 3.5} fill="#67e8f9" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                              P95: ${results.percentile95[steps]?.toFixed(1)}
                            </text>

                            {/* P50 Median Endpoint Badge */}
                            <line x1={xT} y1={yP50} x2={xT + 6} y2={yP50} stroke="#38bdf8" strokeWidth="2" />
                            <circle cx={xT} cy={yP50} r="4" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                            <rect x={xT + 6} y={yP50 - 9} width="64" height="18" rx="4" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.2" />
                            <text x={xT + 38} y={yP50 + 3.5} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                              P50: ${results.percentile50[steps]?.toFixed(1)}
                            </text>

                            {/* VaR 95% Endpoint Badge */}
                            <line x1={xT} y1={yVaR} x2={xT + 6} y2={yVaR} stroke="#f43f5e" strokeWidth="1.5" />
                            <circle cx={xT} cy={yVaR} r="3" fill="#f43f5e" />
                            <rect x={xT + 6} y={yVaR - 8} width="62" height="16" rx="3" fill="#4c0519" stroke="#f43f5e" strokeWidth="0.8" />
                            <text x={xT + 37} y={yVaR + 3.5} fill="#fecdd3" fontSize="8" fontWeight="bold" textAnchor="middle">
                              VaR: ${results.var95Price?.toFixed(1)}
                            </text>

                            {/* P5 Endpoint Badge */}
                            <line x1={xT} y1={yP5} x2={xT + 6} y2={yP5} stroke="#f59e0b" strokeWidth="1" />
                            <circle cx={xT} cy={yP5} r="2.5" fill="#f59e0b" />
                            <rect x={xT + 6} y={yP5 - 7} width="60" height="14" rx="3" fill="#451a03" stroke="#f59e0b" strokeWidth="0.8" />
                            <text x={xT + 36} y={yP5 + 3} fill="#fde68a" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                              P5: ${results.percentile5[steps]?.toFixed(1)}
                            </text>
                          </g>
                        );
                      })()}

                      {/* Interactive Hover Crosshair & Dots */}
                      {hoverStep !== null && (
                        <g>
                          {/* Vertical glowing laser line */}
                          <line
                            x1={xScale(hoverStep)}
                            y1={padding.top}
                            x2={xScale(hoverStep)}
                            y2={height - padding.bottom}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="3,3"
                          />

                          {/* Glowing inspection dots */}
                          <circle cx={xScale(hoverStep)} cy={yScale(results.percentile95[hoverStep])} r="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                          <circle cx={xScale(hoverStep)} cy={yScale(results.percentile75[hoverStep])} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                          <circle cx={xScale(hoverStep)} cy={yScale(results.percentile50[hoverStep])} r="5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                          <circle cx={xScale(hoverStep)} cy={yScale(results.percentile25[hoverStep])} r="3.5" fill="#818cf8" stroke="#ffffff" strokeWidth="1" />
                          <circle cx={xScale(hoverStep)} cy={yScale(results.percentile5[hoverStep])} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                        </g>
                      )}

                      {/* X Axis Timeline Labels */}
                      <text x={padding.left} y={height - 12} fill="#64748b" fontSize="9">Día 0</text>
                      <text x={xScale(Math.floor(steps * 0.25))} y={height - 12} fill="#64748b" fontSize="9" textAnchor="middle">
                        Día {Math.floor(steps * 0.25)}
                      </text>
                      <text x={xScale(Math.floor(steps * 0.5))} y={height - 12} fill="#64748b" fontSize="9" textAnchor="middle">
                        Día {Math.floor(steps * 0.5)}
                      </text>
                      <text x={xScale(Math.floor(steps * 0.75))} y={height - 12} fill="#64748b" fontSize="9" textAnchor="middle">
                        Día {Math.floor(steps * 0.75)}
                      </text>
                      <text x={xScale(steps)} y={height - 12} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                        Día {steps}
                      </text>
                    </svg>
                  );
                })()}
              </div>

              {/* Bottom Explanatory Strip */}
              <div className="mt-2.5 text-[11px] text-slate-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <span>
                  💡 <strong>Propiedad de Difusión de Wiener:</strong> El cono de incertidumbre se ensancha proporcionalmente a &radic;t. Pasa el cursor por la gráfica para inspeccionar los percentiles día por día.
                </span>
                <span className="text-cyan-400 font-semibold">
                  Mediana (P50) = ${results.medianFinal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Histogram (Final Price Distribution) */}
            <div className="lg:col-span-2 bg-slate-900/60 rounded-xl border border-slate-800 p-3 flex flex-col">
              <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">DISTRIBUCIÓN EN T ({days} DÍAS)</span>
                </div>
                <span className="text-[10px] text-slate-400">Log-Normal</span>
              </div>

              {/* Histogram SVG */}
              <div className="w-full">
                {(() => {
                  const width = 420;
                  const height = 320;
                  const padding = { top: 20, right: 20, bottom: 35, left: 40 };

                  const maxCount = Math.max(...results.histBins.map(b => b.count), 1);
                  const minX = results.histBins[0]?.x0 || results.s0 * 0.7;
                  const maxX = results.histBins[results.histBins.length - 1]?.x1 || results.s0 * 1.3;
                  const rangeX = maxX - minX || 1;

                  const xScale = (p: number) => padding.left + ((p - minX) / rangeX) * (width - padding.left - padding.right);
                  const yScale = (c: number) => height - padding.bottom - (c / maxCount) * (height - padding.top - padding.bottom);

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono">
                      {/* Gridlines */}
                      {[0.25, 0.5, 0.75].map(ratio => {
                        const y = padding.top + ratio * (height - padding.top - padding.bottom);
                        return (
                          <line key={ratio} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3,3" />
                        );
                      })}

                      {/* Histogram Bins */}
                      {results.histBins.map((bin, i) => {
                        const x0 = xScale(bin.x0);
                        const x1 = xScale(bin.x1);
                        const bWidth = Math.max(1, x1 - x0 - 0.5);
                        const bHeight = (bin.count / maxCount) * (height - padding.top - padding.bottom);
                        const y = height - padding.bottom - bHeight;

                        // Red color for VaR tail (< var95Price)
                        const isTail = bin.x1 <= results.var95Price;
                        const fill = isTail ? '#f43f5e' : '#0ea5e9';

                        return (
                          <rect
                            key={i}
                            x={x0}
                            y={y}
                            width={bWidth}
                            height={bHeight}
                            fill={fill}
                            opacity={isTail ? 0.85 : 0.7}
                            rx="1"
                          />
                        );
                      })}

                      {/* S0 Line */}
                      <line
                        x1={xScale(results.s0)}
                        y1={padding.top}
                        x2={xScale(results.s0)}
                        y2={height - padding.bottom}
                        stroke="#cbd5e1"
                        strokeDasharray="3,3"
                        strokeWidth="1.5"
                      />
                      <text x={xScale(results.s0)} y={padding.top + 8} fill="#cbd5e1" fontSize="8.5" textAnchor="middle">
                        S₀
                      </text>

                      {/* Mean Line */}
                      <line
                        x1={xScale(results.meanFinal)}
                        y1={padding.top}
                        x2={xScale(results.meanFinal)}
                        y2={height - padding.bottom}
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      <text x={xScale(results.meanFinal)} y={padding.top + 20} fill="#10b981" fontSize="8.5" textAnchor="middle">
                        Media
                      </text>

                      {/* VaR 95% Cutoff */}
                      <line
                        x1={xScale(results.var95Price)}
                        y1={padding.top}
                        x2={xScale(results.var95Price)}
                        y2={height - padding.bottom}
                        stroke="#f43f5e"
                        strokeDasharray="2,2"
                        strokeWidth="2"
                      />
                      <text x={xScale(results.var95Price)} y={padding.top + 32} fill="#fb7185" fontSize="8.5" textAnchor="middle">
                        VaR 95%
                      </text>

                      {/* X Axis ticks */}
                      <text x={padding.left} y={height - 12} fill="#64748b" fontSize="8.5">
                        ${minX.toFixed(0)}
                      </text>
                      <text x={width / 2} y={height - 12} fill="#64748b" fontSize="8.5" textAnchor="middle">
                        Precio Final ($)
                      </text>
                      <text x={width - padding.right} y={height - 12} fill="#64748b" fontSize="8.5" textAnchor="end">
                        ${maxX.toFixed(0)}
                      </text>
                    </svg>
                  );
                })()}
              </div>

              <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/60">
                <span className="text-rose-400 font-semibold">Zona Roja (Cola 5%):</span> Representa los peores escenarios estocásticos. El promedio en esa zona es el CVaR (${results.cvarPrice.toFixed(2)}).
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
