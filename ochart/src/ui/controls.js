import { sync } from '../core/sync.js';
import { themeManager } from './theme-manager.js';
import { pushLog } from './dev-hud.js';

let currentScale = 'logarithmic';
let currentType  = 'line';
let currentRows  = [];

export function setupControls(engine, tableModal){
  const $ = (sel) => document.getElementById(sel);
  const statusEl = $('status');

  // logger seguro (não explode se pushLog não existir)
  const log = (payload) => { try { pushLog?.(payload); } catch (_) {} };

  function setScale(scale){
    const currentScale = (scale === 'linear') ? 'linear' : 'logarithmic';

    $('btn-scale-linear')?.classList.toggle('active', currentScale === 'linear');
    $('btn-scale-log')?.classList.toggle('active', currentScale === 'logarithmic');

    if (engine) engine.setScale(currentScale);

    log({ level:'info', msg:'scale_change', ts:Date.now(), data:{ scale: currentScale } });

    const tag = currentScale === 'logarithmic' ? 'Log' : 'Linear';
    if (statusEl) statusEl.textContent = `OK (${tag})`;
  }

  function setType(type){
    const currentType = (type === 'candlestick') ? 'candlestick' : 'line';

    $('btn-type-line')?.classList.toggle('active', currentType === 'line');
    $('btn-type-candle')?.classList.toggle('active', currentType === 'candlestick');

    if (engine) engine.setType(currentType);

    log({ level:'info', msg:'chart_type_change', ts:Date.now(), data:{ type: currentType } });

    if (statusEl) statusEl.textContent = `OK (${currentType === 'candlestick' ? 'Candle' : 'Line'})`;
  }

  // Bind: escala
  $('btn-scale-linear')?.addEventListener('click', ()=> setScale('linear'));
  $('btn-scale-log')?.addEventListener('click',    ()=> setScale('logarithmic'));

  // Bind: tipo (line/candle)
  $('btn-type-line')?.addEventListener('click',   ()=> setType('line'));
  $('btn-type-candle')?.addEventListener('click', ()=> setType('candlestick'));

  // Bind: sync + timeframe
  $('btn-sync')?.addEventListener('click', ()=> {
    const tf    = $('sel-tf')?.value || '1d';
    const scale = engine?.currentConfig?.scale || 'logarithmic';
    const type  = engine?.currentConfig?.type  || 'line';
    sync(engine, tf, scale, type);
  });

  $('sel-tf')?.addEventListener('change', (e)=> {
    const tf    = e.target.value || '1d';
    const scale = engine?.currentConfig?.scale || 'logarithmic';
    const type  = engine?.currentConfig?.type  || 'line';
    sync(engine, tf, scale, type);
  });

  // Bind: tabela (usa os dados atuais do engine)
  $('btn-table')?.addEventListener('click', ()=> {
    const rows = Array.isArray(engine?.currentData) ? engine.currentData.slice() : [];
    tableModal?.show(rows);
    const exportBtn = tableModal?.el?.querySelector('#tm-export');
    if (exportBtn) exportBtn.onclick = ()=> tableModal.exportCSV();
  });

  // Bind: tema
  $('btn-theme')?.addEventListener('click', ()=> themeManager.toggleTheme());

  // Primeira sync (mantive aqui; se o app.js já chama sync no boot, remova uma das duas para evitar dupla chamada)
  const tfInit = $('sel-tf')?.value || '1d';
  const scaleInit = engine?.currentConfig?.scale || 'logarithmic';
  const typeInit  = engine?.currentConfig?.type  || 'line';
  sync(engine, tfInit, scaleInit, typeInit);
}

