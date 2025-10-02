// BridgeOChart - conecta sinais ao Chart
export default class BridgeOChart {
  constructor(chart) { this.chart = chart; }
  sendSignal(signal) {
    console.log("📡 Signal:", signal);
    if (this.chart?.addAnnotation) {
      this.chart.addAnnotation({
        id: Date.now().toString(),
        type: 'label',
        x: signal.price,
        y: signal.price,
        content: signal.type
      });
    }
  }
}
