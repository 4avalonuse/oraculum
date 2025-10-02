// oalgo/backtest/backtest.js
// Fase 11: chama Bridge para desenhar sinais no gráfico
export default class Backtest {
  constructor(engine, candles, canvas, bridge=null) {
    this.engine = engine;
    this.candles = candles;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.index = 0;
    this.running = false;

    this.bridge = bridge;
    this.pnl = 0;
    this.pnlHistory = [];
    this.lastAction = null; 
    this.lastPrice = null;
  }

  run() {
    this.running = true;
    this.loop();
  }

  loop() {
    if (!this.running || this.index >= this.candles.length) return;
    const candle = this.candles[this.index];
    this.engine.run({ price: candle.c });

    this._processAlgo(candle);
    this.draw(candle);
    this.index++;
    setTimeout(() => this.loop(), 50);
  }

  _processAlgo(candle) {
    if (this.engine.algorithm.steps.some(s => s.if === "price > 100" && candle.c > 100)) {
      this.lastAction = "SELL";
      if (this.lastPrice) this.pnl += (candle.c - this.lastPrice) * -1;
      this.lastPrice = candle.c;
      this.bridge?.sendSignal({ type: "SELL", price: candle.c, time: candle.t });
    }
    if (this.engine.algorithm.steps.some(s => s.if === "price < 80" && candle.c < 80)) {
      this.lastAction = "BUY";
      this.lastPrice = candle.c;
      this.bridge?.sendSignal({ type: "BUY", price: candle.c, time: candle.t });
    }
    this.pnlHistory.push({ x: this.index, y: this.pnl });
  }

  draw(candle) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const mid = Math.floor(h * 0.7);

    this.ctx.clearRect(0, 0, w, h);

    const visible = this.candles.slice(0, this.index + 1);
    const prices = visible.flatMap(c => [c.o, c.h, c.l, c.c]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const scaleY = (price) => mid - (price - min) / (max - min) * (mid - 10);
    const stepX = w / visible.length;

    visible.forEach((c, i) => {
      const x = i * stepX + stepX / 2;
      const openY = scaleY(c.o);
      const closeY = scaleY(c.c);
      const highY = scaleY(c.h);
      const lowY = scaleY(c.l);

      this.ctx.strokeStyle = (c.c >= c.o) ? "#10b981" : "#ef4444";
      this.ctx.beginPath();
      this.ctx.moveTo(x, highY);
      this.ctx.lineTo(x, lowY);
      this.ctx.stroke();

      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(x, openY);
      this.ctx.lineTo(x, closeY);
      this.ctx.stroke();
      this.ctx.lineWidth = 1;
    });

    if (this.pnlHistory.length > 1) {
      const pnlVals = this.pnlHistory.map(p => p.y);
      const minP = Math.min(...pnlVals);
      const maxP = Math.max(...pnlVals);
      const scalePnL = (v) => mid + 10 + (v - minP) / (maxP - minP || 1) * (h - mid - 20);

      this.ctx.strokeStyle = "#3b82f6";
      this.ctx.beginPath();
      this.pnlHistory.forEach((p, i) => {
        const x = i * stepX + stepX / 2;
        const y = h - scalePnL(p.y);
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      });
      this.ctx.stroke();
    }
  }
}
