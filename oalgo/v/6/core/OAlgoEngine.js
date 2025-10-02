// core/OAlgoEngine.js
var OAlgoEngine = {
  run: function(data) {
    console.log("OAlgoEngine rodando com:", data);
    const resultData = {
      labels: data.steps.map((s, i) => 'Passo ' + (i+1)),
      datasets: [{
        label: 'Exemplo',
        data: data.steps.map(s => Number(s.value) || 0)
      }]
    };
    BridgeOChart.updateChart(resultData);
  }
};
