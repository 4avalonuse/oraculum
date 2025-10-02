export function report(trades, metrics) {
  console.log('=== Backtest Report ===');
  console.log('Trades:', trades.length);
  console.log('Final Equity:', metrics.finalEquity);
  console.log('Profit:', metrics.profit);
  console.log('WinRate:', (metrics.winRate*100).toFixed(1)+'%');
}
