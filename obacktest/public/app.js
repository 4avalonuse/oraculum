import { runBacktest } from '../core/backtest-engine.js';
import { samplePortfolio } from '../core/portfolio.js';
import { computeMetrics } from '../core/metrics.js';

document.getElementById('btnRun').onclick = async () => {
  const mockData = await fetch('./mock/BTC-USD_1d.json').then(r => r.json());
  const portfolio = samplePortfolio();
  const result = runBacktest(mockData, portfolio);
  const metrics = computeMetrics(result.trades, portfolio);
  document.getElementById('results').innerHTML = `
    <h2>Resultados</h2>
    <p>Trades: ${result.trades.length}</p>
    <p>Equity Final: ${portfolio.equity.toFixed(2)}</p>
    <p>PnL: ${metrics.pnl.toFixed(2)}</p>
    <p>Drawdown Máx: ${metrics.maxDrawdown.toFixed(2)}</p>
  `;
};