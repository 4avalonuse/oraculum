// C:\4Avalon\projetos\oraculum\oalgo\core\Templates.js
// v12.4 — templates simples para começar rápido
export const Templates = {
  "SMA20 Crossover": {
    name: "SMA20 Crossover",
    params: { orderSize: 1, commission: 0, slippage: 0 },
    steps: [
      { if: "crossover_up_SMA20", then: "BUY" },
      { if: "crossover_down_SMA20", then: "SELL" }
    ]
  },
  "Price Bands": {
    name: "Price Bands",
    params: { orderSize: 1, commission: 0, slippage: 0 },
    steps: [
      { if: "price < 80", then: "BUY" },
      { if: "price > 120", then: "SELL" }
    ]
  }
};
