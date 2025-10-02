// oalgo/backtest/portfolio.js
import { safe } from './utils.js';

export class Portfolio {
  constructor({ initialBalance=10000, orderSize=1, commission=0.001, slippage=0.0005 }={}) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.orderSize = orderSize;
    this.commission = commission;
    this.slippage = slippage;
    this.position = null; // "LONG" | null
    this.entryPrice = null;
    this.entryIndex = null;
    this.trades = [];
    this.equity = initialBalance;
    this.maxEquity = initialBalance;
    this.maxDrawdown = 0;
    this.history = [{ x: 0, y: initialBalance, balance: initialBalance }];
    this.totals = { total:0, wins:0, losses:0, grossProfit:0, grossLoss:0, returns:[] };
  }

  buy(candle, idx) {
    if (this.position) return;
    const price = safe(candle.c) * (1 + this.slippage);
    const orderValue = price * this.orderSize;
    const fee = orderValue * this.commission;
    this.balance -= (orderValue + fee);
    this.position = "LONG";
    this.entryPrice = price;
    this.entryIndex = idx;
  }

  sell(candle, idx) {
    if (this.position !== "LONG") return;
    const price = safe(candle.c) * (1 - this.slippage);
    const orderValue = price * this.orderSize;
    const fee = orderValue * this.commission;
    this.balance += (orderValue - fee);

    const profit = (price - this.entryPrice) * this.orderSize - (this.entryPrice*this.orderSize*this.commission) - (orderValue*this.commission);
    const pct = (price - this.entryPrice) / this.entryPrice * 100;

    this.trades.push({
      entry: this.entryPrice,
      exit: price,
      entryTime: this.entryIndex,
      exitTime: idx,
      profit,
      profitPct: pct,
      type: profit>0 ? "WIN" : "LOSS"
    });

    this.totals.total++;
    if (profit>0) { this.totals.wins++; this.totals.grossProfit += profit; }
    else { this.totals.losses++; this.totals.grossLoss += Math.abs(profit); }
    this.totals.returns.push((price - this.entryPrice)/this.entryPrice);

    this.position = null;
    this.entryPrice = null;
    this.entryIndex = null;
  }

  markToMarket(candle, idx) {
    const currentVal = this.position==="LONG" && this.entryPrice
      ? safe(candle.c) * this.orderSize
      : 0;
    this.equity = this.balance + currentVal;
    if (this.equity > this.maxEquity) this.maxEquity = this.equity;
    const dd = (this.maxEquity - this.equity) / this.maxEquity * 100;
    if (dd > this.maxDrawdown) this.maxDrawdown = dd;
    this.history.push({ x: idx, y: this.equity, balance: this.balance });
  }
}
