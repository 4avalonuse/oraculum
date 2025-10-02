// Backtest simples animado com Hub data
export default class Backtest {
  constructor(engine, candles, canvas) {
    this.engine = engine;
    this.candles = candles;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.index = 0;
    this.running = false;
  }

  run() {
    this.running = true;
    this.loop();
  }

  loop() {
    if (!this.running || this.index >= this.candles.length) return;
    const candle = this.candles[this.index];
    this.engine.run({ price: candle.c });
    this.drawCandle(candle);
    this.index++;
    setTimeout(() => this.loop(), 100);
  }

  drawCandle(candle) {
    const x = this.index * 5;
    const y = this.canvas.height - candle.c / 100;
    this.ctx.fillStyle = "#3b82f6";
    this.ctx.fillRect(x, y, 4, 4);
  }
}
