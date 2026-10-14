import { MonteCarloConfig, MonteCarloResult } from '../types/market';

/**
 * Standard Normal Random Deviate using Box-Muller transform
 */
function randomStandardNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Executes 10,000 Monte Carlo trajectories of Geometric Brownian Motion (GBM):
 * S_t = S_0 * exp((mu - 0.5 * sigma^2) * dt + sigma * sqrt(dt) * Z)
 */
export function runMonteCarloSimulation(config: MonteCarloConfig): MonteCarloResult {
  const { s0, days, volatility, drift, numSimulations } = config;
  const dt = 1.0 / 252.0; // Daily trading time step (252 trading days/year)
  const steps = Math.max(1, Math.round(days));

  const driftComponent = (drift - 0.5 * volatility * volatility) * dt;
  const volSqrtDt = volatility * Math.sqrt(dt);

  // We want to capture:
  // 1. All final prices S_T (for 10,000 simulations)
  const finalPrices = new Float64Array(numSimulations);

  // 2. Sample ~100 trajectories across all steps for visual plotting
  const numSamplePaths = Math.min(100, numSimulations);
  const samplePaths: number[][] = Array.from({ length: numSamplePaths }, () => {
    const arr = new Array(steps + 1);
    arr[0] = s0;
    return arr;
  });

  // 3. For percentiles across time, we accumulate prices at each step
  // To avoid storing a 10,000 x 252 matrix in memory, we can sample step slices
  // or allocate matrix. 10000 * 252 * 8 bytes = 20MB, which easily fits in memory!
  const allPaths = new Float64Array(numSimulations * (steps + 1));

  // Initialize step 0
  for (let sim = 0; sim < numSimulations; sim++) {
    allPaths[sim * (steps + 1) + 0] = s0;
  }

  // Generate paths
  for (let sim = 0; sim < numSimulations; sim++) {
    let currentS = s0;
    const isSample = sim < numSamplePaths;

    for (let step = 1; step <= steps; step++) {
      const z = randomStandardNormal();
      const returnStep = driftComponent + volSqrtDt * z;
      currentS = currentS * Math.exp(returnStep);

      allPaths[sim * (steps + 1) + step] = currentS;

      if (isSample) {
        samplePaths[sim][step] = currentS;
      }
    }
    finalPrices[sim] = currentS;
  }

  // Calculate percentiles at each step
  const timeGrid: number[] = [];
  const percentile5: number[] = [];
  const percentile25: number[] = [];
  const percentile50: number[] = [];
  const percentile75: number[] = [];
  const percentile95: number[] = [];

  const stepSlice = new Float64Array(numSimulations);

  for (let step = 0; step <= steps; step++) {
    timeGrid.push(step);
    for (let sim = 0; sim < numSimulations; sim++) {
      stepSlice[sim] = allPaths[sim * (steps + 1) + step];
    }
    // Sort slice to compute percentiles
    stepSlice.sort();

    percentile5.push(stepSlice[Math.floor(numSimulations * 0.05)]);
    percentile25.push(stepSlice[Math.floor(numSimulations * 0.25)]);
    percentile50.push(stepSlice[Math.floor(numSimulations * 0.50)]);
    percentile75.push(stepSlice[Math.floor(numSimulations * 0.75)]);
    percentile95.push(stepSlice[Math.floor(numSimulations * 0.95)]);
  }

  // Final summary statistics
  const sortedFinal = Float64Array.from(finalPrices).sort();
  let sum = 0;
  let winCount = 0;
  for (let i = 0; i < numSimulations; i++) {
    sum += sortedFinal[i];
    if (sortedFinal[i] > s0) winCount++;
  }
  const meanFinal = sum / numSimulations;
  const medianFinal = sortedFinal[Math.floor(numSimulations * 0.5)];

  let varianceSum = 0;
  for (let i = 0; i < numSimulations; i++) {
    const diff = sortedFinal[i] - meanFinal;
    varianceSum += diff * diff;
  }
  const stdFinal = Math.sqrt(varianceSum / numSimulations);

  // VaR at 95% (5th percentile of price distribution)
  const varIndex = Math.floor(numSimulations * 0.05);
  const var95Price = sortedFinal[varIndex];
  const var95LossDollar = Math.max(0, s0 - var95Price);
  const var95LossPct = (var95LossDollar / s0) * 100;

  // CVaR (Expected Shortfall) = Average of worst 5% tail
  let tailSum = 0;
  for (let i = 0; i <= varIndex; i++) {
    tailSum += sortedFinal[i];
  }
  const cvarPrice = tailSum / (varIndex + 1);
  const cvarLossDollar = Math.max(0, s0 - cvarPrice);
  const cvarLossPct = (cvarLossDollar / s0) * 100;

  const probProfit = (winCount / numSimulations) * 100;

  // Histogram calculation
  const minPrice = sortedFinal[Math.floor(numSimulations * 0.005)];
  const maxPrice = sortedFinal[Math.floor(numSimulations * 0.995)];
  const binCount = 35;
  const binWidth = (maxPrice - minPrice) / binCount;

  const histBins = [];
  for (let b = 0; b < binCount; b++) {
    const x0 = minPrice + b * binWidth;
    const x1 = x0 + binWidth;
    let count = 0;
    for (let i = 0; i < numSimulations; i++) {
      if (sortedFinal[i] >= x0 && (b === binCount - 1 ? sortedFinal[i] <= x1 : sortedFinal[i] < x1)) {
        count++;
      }
    }
    histBins.push({
      x0,
      x1,
      count,
      pct: (count / numSimulations) * 100
    });
  }

  return {
    s0,
    days,
    volatility,
    drift,
    numSimulations,
    samplePaths,
    timeGrid,
    percentile5,
    percentile25,
    percentile50,
    percentile75,
    percentile95,
    finalPrices: sortedFinal,
    meanFinal,
    medianFinal,
    stdFinal,
    var95Price,
    var95LossDollar,
    var95LossPct,
    cvarPrice,
    cvarLossDollar,
    cvarLossPct,
    probProfit,
    histBins
  };
}
