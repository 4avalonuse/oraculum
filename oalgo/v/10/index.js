// OAlgo Phase 10
import { Hub } from '../hub/index.js';
import LegoUI from './ui/lego.js';
import DevUI from './ui/dev.js';
import Backtest from './backtest/backtest.js';

window.addEventListener("DOMContentLoaded", async () => {
  await Hub.init('1d'); // pega candles do Hub

  const mode = new URLSearchParams(window.location.search).get("mode") || "lego";
  let ui = (mode === "dev") ? new DevUI("app") : new LegoUI("app");

  const candles = Hub.getSeries('1d');
  console.log("📊 Série recebida do Hub:", candles.length);

  const canvas = document.getElementById("chart");
  const backtest = new Backtest(ui.engine, candles, canvas);
  backtest.run();
});
