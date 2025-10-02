// oalgo/index.js
import LegoUI from "./ui/lego.js";
import BridgeOChart from "./core/BridgeOChart.js";

class MockChart {
  addAnnotation(signal) {
    console.log("📈 Chart received signal:", signal);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const lego = new LegoUI("app");

  const mockChart = new MockChart();
  const bridge = new BridgeOChart(mockChart);
  lego.engine.setBridge(bridge);

  setTimeout(() => {
    lego.engine.run({ price: 105 });
    lego.engine.run({ price: 75 });
  }, 2000);
});
