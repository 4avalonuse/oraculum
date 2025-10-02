// OAlgo Phase 9 - Integrado ao Hub
import { Hub } from '../hub/index.js';
import LegoUI from './ui/lego.js';
import DevUI from './ui/dev.js';
import Backtest from './backtest/backtest.js';

window.addEventListener("DOMContentLoaded", async () => {
  // Inicializa o Hub (puxa dados do OChart via adapter)
  await Hub.init('1d');

  const mode = new URLSearchParams(window.location.search).get("mode") || "lego";
  let ui = (mode === "dev") ? new DevUI("app") : new LegoUI("app");

  // Obtém candles do Hub
  const candles = Hub.getSeries('1d');
  console.log("📊 OAlgo recebeu série do Hub:", candles.length);

  // Cria backtest animado
  const canvas = document.getElementById("chart");
  const backtest = new Backtest(ui.engine, candles, canvas);
  backtest.run();

  // Reage a eventos do Hub
  Hub.on('series:loaded', ({ tf, data }) => {
    console.log(`⚡ Série ${tf} recarregada (${data.length} pontos)`);
  });
});
