import { actions, getState, subscribe } from '../../state/store.js';
import { fetchYahoo } from '../../services/yahoo.js';
import { exportJSON, exportCSV } from '../../utils/exporter.js';

let chart;

export function mount(el){
  el.innerHTML = `
    <section class="space-y-3">
      <h2 class="text-xl font-semibold">Dashboard</h2>
      <div class="flex gap-2 flex-wrap">
        <button id="btn-update" class="px-3 py-1 border rounded">Atualizar</button>
        <button id="btn-export-json" class="px-3 py-1 border rounded">Exportar JSON</button>
        <button id="btn-export-csv" class="px-3 py-1 border rounded">Exportar CSV</button>
        <a id="btn-tv" class="px-3 py-1 border rounded" target="_blank" rel="noopener">Abrir no TradingView</a>
      </div>
      <div class="text-sm text-gray-600" id="stats"></div>
      <div class="bg-white rounded border p-2">
        <canvas id="c"></canvas>
      </div>
    </section>
  `;

  const c = el.querySelector('#c').getContext('2d');
  chart = new Chart(c, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Close', data: [] }] },
    options: {
      parsing: false,
      normalized: true,
      animation: false,
      scales: { x: { ticks: { maxRotation: 0 } } }
    }
  });

  const stats = el.querySelector('#stats');
  const tv = el.querySelector('#btn-tv');

  function render(){
    const s = getState();
    const ds = s.data.btc.ohlc;
    const labels = ds.map(d => new Date(d.t).toISOString().slice(0,10));
    const values = ds.map(d => d.c);
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update('none');

    const n = ds.length;
    const last = n ? labels[n-1] : '—';
    stats.textContent = `Símbolo: ${s.data.symbol} | TF: ${s.data.timeframe} | candles: ${n} | último: ${last}`;
    tv.href = `https://www.tradingview.com/symbols/${s.data.symbol.replace('-','')}/`;
  }
  render();
  const off = subscribe(render);

  el.querySelector('#btn-update').onclick = async ()=>{
    try{
      actions.setLoading(true);
      const tf = getState().data.timeframe;                 // respeita o TF selecionado
      const range = tf==='1d' ? '6mo' : tf==='1w' ? '2y' : '10y';
      const res = await fetchYahoo(getState().data.symbol, tf, range);
      actions.setBtcSeries(res.data, { lastSync: Date.now(), source:'yahoo' });
      actions.toast('Atualizado');
    }catch(e){
      actions.pushLog({level:'error', msg:'update_fail', ts: Date.now(), data:{err:String(e)}});
    }finally{
      actions.setLoading(false);
    }
  };
  el.querySelector('#btn-export-json').onclick = ()=> exportJSON('btc_'+getState().data.timeframe+'.json', getState().data.btc.ohlc);
  el.querySelector('#btn-export-csv').onclick  = ()=>{
    const rows = getState().data.btc.ohlc.map(({t,o,h,l,c,v})=> ({ time:new Date(t).toISOString(), open:o, high:h, low:l, close:c, volume:v }));
    exportCSV('btc_'+getState().data.timeframe+'.csv', rows);
  };

  el._unmount = ()=> off();
}

export function unmount(el){ el?._unmount?.(); }
