// core/Backtest.js — anima cursor e sinais
var Backtest = (function(){
  function create(prices, engine, chart){
    let i = 0, timer = null;
    function tick(){
      if (i >= prices.length){ pause(); return; }
      const price = prices[i];
      BridgeOChart.setCursor(chart, i, price);
      const signals = engine.evalAt(price);
      for (const s of signals){ BridgeOChart.addSignal(chart, i, price, s.type); }
      i += 1;
    }
    function start(speedMs){ pause(); timer = setInterval(tick, Math.max(30, speedMs||120)); }
    function pause(){ if (timer){ clearInterval(timer); timer = null; } }
    function reset(){
      pause(); i = 0;
      chart.data.datasets[1].data = [];
      chart.data.datasets[2].data = [];
      chart.data.datasets[3].data = [];
      chart.update('none');
    }
    return { start, pause, reset };
  }
  return { create };
})();
