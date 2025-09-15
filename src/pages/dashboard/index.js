import { actions, getState, subscribe } from '../../state/store.js';
import { fetchYahoo } from '../../services/yahoo.js';
import { exportJSON, exportCSV } from '../../utils/exporter.js';

let chart, off, btn;

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
      <div class="bg-white rounded border p-2 h-80">
        <canvas id="c"></canvas>
      </div>
    </section>
  `;

  const ctx = el.querySelector('#c').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: { datasets: [{ label: 'Close', data: [], pointRadius: 0, borderWidth: 1 }] },
    options: {
      parsing: false,
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: true } },
      scales: {
        x: { type: 'time', time: { unit: 'day' } },
        y: { beginAtZero: false }
      }
    }
  });

  const stats = el.querySelector('#stats');
  const tv = el.querySelector('#btn-tv');
  btn = el.querySelector('#btn-update');

  function render(){
    const s = getState();
    const ds = s.data.btc.ohlc;
    // Use {x,y} with epoch ms for time scale
    chart.data.datasets[0].data = ds.map(d => ({ x: d.t, y: d.c }));
    chart.update('none');

    const n = ds.length;
    const last = n ? new Date(ds[n-1].t).toISOString().slice(0,10) : '—';
    stats.textContent = `Símbolo: ${s.data.symbol} | TF: ${s.data.timeframe} | candles: ${n} | último: ${last}`;
    tv.href = `https://www.tradingview.com/symbols/${s.data.symbol.replace('-','')}/`;
  }
  render();
  off = subscribe(render);

  btn.onclick = onUpdate;
  el.querySelector('#btn-export-json').onclick = ()=> exportJSON('btc_'+getState().data.timeframe+'.json', getState().data.btc.ohlc);
  el.querySelector('#btn-export-csv').onclick  = ()=>{
    const rows = getState().data.btc.ohlc.map(({t,o,h,l,c,v})=> ({ time:new Date(t).toISOString(), open:o, high:h, low:l, close:c, volume:v }));
    exportCSV('btc_'+getState().data.timeframe+'.csv', rows);
  };

  el._unmount = ()=> unmount(el);
}

async function onUpdate(){
  try{
    actions.setLoading(true);
    btn.disabled = true;
    const tf = getState().data.timeframe;
    const range = tf==='1d' ? '6mo' : tf==='1w' ? '2y' : '10y';
    const res = await fetchYahoo(getState().data.symbol, tf, range);
    actions.setBtcSeries(res.data, { lastSync: Date.now(), source:'yahoo' });
    actions.toast('Atualizado');
  }catch(e){
    actions.pushLog({level:'error', msg:'update_fail', ts: Date.now(), data:{err:String(e)}});
  }finally{
    btn.disabled = false;
    actions.setLoading(false);
  }
}

export function unmount(el){
  off?.();
  if(chart){ chart.destroy(); chart = null; }
}
