// oalgo/backtest/metrics.js
export function summarize(portfolio) {
  const pnl = portfolio.balance - portfolio.initialBalance;
  const winRate = portfolio.totals.total>0 ? (portfolio.totals.wins/portfolio.totals.total*100) : 0;
  const returns = portfolio.totals.returns;
  const mean = returns.length ? returns.reduce((a,b)=>a+b,0)/returns.length : 0;
  const stdev = returns.length ? Math.sqrt(returns.reduce((s,r)=>s+Math.pow(r-mean,2),0)/returns.length) : 0;
  const sharpe = stdev ? (mean / stdev) * Math.sqrt(252) : 0;
  return {
    totalTrades: portfolio.totals.total,
    winRate,
    grossProfit: portfolio.totals.grossProfit,
    grossLoss: portfolio.totals.grossLoss,
    pnl,
    maxDrawdown: portfolio.maxDrawdown,
    sharpe,
    totalReturnPct: (portfolio.equity - portfolio.initialBalance) / portfolio.initialBalance * 100
  };
}
