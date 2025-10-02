// C:\4Avalon\projetos\oraculum\oalgo\core\BridgeOChart.js
export default class BridgeOChart {
  constructor(chart) { this.chart = chart; }

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
          backgroundColor: signal.type === "BUY" ? "rgba(16,185,129,0.85)" : "rgba(239,68,68,0.85)",
          color: "#fff",
          fontSize: "12px",
          padding: 4
        }
      });
    }
  }
}
