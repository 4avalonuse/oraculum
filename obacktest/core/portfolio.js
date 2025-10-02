export class Portfolio {
  constructor({ initialEquity = 10000, feePct = 0.001 } = {}) {
    this.equity = initialEquity;
    this.feePct = feePct;
    this.position = null;
    this.history = [];
  }

  execute(signal, candle) {
    const { action, qty, price } = signal;
    if (action === 'buy' && !this.position) {
      const cost = qty * price * (1 + this.feePct);
      if (this.equity >= cost) {
        this.equity -= cost;
        this.position = { qty, entry: price };
        return { type: 'buy', qty, price, ts: candle.t };
      }
    }
    if (action === 'sell' && this.position) {
      const revenue = qty * price * (1 - this.feePct);
      this.equity += revenue;
      this.position = null;
      return { type: 'sell', qty, price, ts: candle.t };
    }
    return null;
  }
}
