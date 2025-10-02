// core/BridgeOChart.js — Chart.js com cursor e sinais
var BridgeOChart = (function(){
  function createChart(ctx, prices){
    const labels = prices.map((_, i) => i);
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Preço', data: prices, pointRadius: 0, borderWidth: 1.5, tension: 0.22 },
          { label: 'Cursor', data: [], type: 'scatter', pointRadius: 5, showLine: false },
          { label: 'BUY', data: [], type: 'scatter', pointRadius: 6 },
          { label: 'SELL', data: [], type: 'scatter', pointRadius: 6 }
        ]
      },
      options: {
        animation: false,
        responsive: true,
        scales: {
          x: { grid: { color: '#1f2a44' }, ticks: { color:'#8ca0c8' } },
          y: { grid: { color: '#1f2a44' }, ticks: { color:'#8ca0c8' } }
        },
        plugins: { legend: { labels: { color:'#c9d7ff' } } }
      }
    });
    return chart;
  }
  function setCursor(chart, index, price){
    chart.data.datasets[1].data = [{ x:index, y:price }];
    chart.update('none');
  }
  function addSignal(chart, index, price, type){
    const dsIdx = type === 'BUY' ? 2 : 3;
    chart.data.datasets[dsIdx].data.push({ x:index, y:price });
    chart.update('none');
  }
  return { createChart, setCursor, addSignal };
})();
