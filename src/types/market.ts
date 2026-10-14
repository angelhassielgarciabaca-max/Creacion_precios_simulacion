export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  price: number;
  volume: number;
  total?: number;
  isBlock?: boolean; // Bloque institucional de liquidez
}

export interface Trade {
  id: string;
  time: string;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  orderType: 'MARKET' | 'LIMIT';
}

export interface MonteCarloConfig {
  s0: number;
  days: number;
  volatility: number; // e.g. 0.25 (25%)
  drift: number;      // e.g. 0.08 (8%)
  numSimulations: number;
}

export interface MonteCarloResult {
  s0: number;
  days: number;
  volatility: number;
  drift: number;
  numSimulations: number;
  samplePaths: number[][]; // ~100 sample trajectories for visual rendering
  timeGrid: number[];
  percentile5: number[];
  percentile25: number[];
  percentile50: number[];
  percentile75: number[];
  percentile95: number[];
  finalPrices: Float64Array | number[];
  meanFinal: number;
  medianFinal: number;
  stdFinal: number;
  var95Price: number;
  var95LossDollar: number;
  var95LossPct: number;
  cvarPrice: number;
  cvarLossDollar: number;
  cvarLossPct: number;
  probProfit: number;
  histBins: { x0: number; x1: number; count: number; pct: number }[];
}
