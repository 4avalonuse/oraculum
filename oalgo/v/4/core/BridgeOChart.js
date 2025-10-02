// oalgo/core/BridgeOChart.js
export default class BridgeOChart {
  constructor(chartEngine) {
    this.chart = chartEngine;
  }

  sendSignal(signal) {
    console.log("📡 Sending signal to OChart:", signal);
    if (this.chart && this.chart.addAnnotation) {
      this.chart.addAnnotation(signal);
    }
  }
}
