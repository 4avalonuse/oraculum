// oalgo/index.js
import LegoUI from "./ui/lego.js";
import DevUI from "./ui/dev.js";
import BridgeOChart from "./core/BridgeOChart.js";

class MockChart {
  addAnnotation(signal) {
    console.log("📈 Chart received signal:", signal);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const mode = new URLSearchParams(window.location.search).get("mode") || "lego";

  let ui;
  if (mode === "lego") {
    ui = new LegoUI("app");
  } else if (mode === "dev") {
    ui = new DevUI("app");
  }

  const mockChart = new MockChart();
  const bridge = new BridgeOChart(mockChart);
  ui.engine.setBridge(bridge);

  setTimeout(() => {
    ui.engine.run({ price: 105 });
    ui.engine.run({ price: 75 });
  }, 2000);
});
