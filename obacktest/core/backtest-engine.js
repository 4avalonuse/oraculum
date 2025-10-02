import { Portfolio } from './portfolio.js';
import { computeMetrics } from './metrics.js';
import { report } from './reporter.js';

export async function runBacktest(strategy, series, opts = {}) {
  const portfolio = new Portfolio(opts);
  const trades = [];

  for (let i = 0; i < series.length; i++) {
    const candle = series[i];
    const ctx = { candle, series: series.slice(0, i+1), position: portfolio.position, equity: portfolio.equity };
    const signal = strategy(ctx);
    if (signal) {
      const trade = portfolio.execute(signal, candle);
      if (trade) trades.push(trade);
    }
  }

  const metrics = computeMetrics(trades, portfolio);
  report(trades, metrics);
  return { trades, metrics };
}
