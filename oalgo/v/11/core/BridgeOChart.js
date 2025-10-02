// oalgo/core/BridgeOChart.js
// Atualizado na Fase 11: envia BUY/SELL como labels no gráfico
export default class BridgeOChart {
  constructor(chart) {
    this.chart = chart;
  }

  sendSignal(signal) {
    console.log("📡 Signal:", signal);
    if (this.chart?.addAnnotation) {
      const id = `${signal.type}-${signal.price}-${Date.now()}`;
      this.chart.addAnnotation({
        id,
        type: 'label',
        x: signal.time || signal.price,
        y: signal.price,
        content: signal.type,
        style: {
          backgroundColor: signal.type === "BUY" ? "rgba(16,185,129,0.8)" : "rgba(239,68,68,0.8)",
          color: "#fff"
        }
      });
    }
  }
}
