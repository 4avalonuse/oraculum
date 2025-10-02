export function computeMetrics(trades, portfolio) {
  const profit = portfolio.equity - 10000;
  const winTrades = trades.filter(t => t.type === 'sell' && t.price > t.entry);
  const winRate = trades.length ? (winTrades.length / trades.length) : 0;
  return { finalEquity: portfolio.equity, profit, trades: trades.length, winRate };
}
