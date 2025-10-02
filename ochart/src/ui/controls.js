import { sync, getCurrentRows } from '../core/sync.js';

export function setupControls(engine, tableModal){
  let currentScale = 'logarithmic';
  let currentType  = 'line';

  const setScale = (scale)=>{
    currentScale = (scale === 'linear') ? 'linear' : 'logarithmic';
    document.getElementById('btn-scale-linear').classList.toggle('active', currentScale==='linear');
    document.getElementById('btn-scale-log').classList.toggle('active', currentScale==='logarithmic');
    if (engine) engine.setScale(currentScale);
    const tag = currentScale==='logarithmic' ? 'Log' : 'Linear';
    document.getElementById('status').textContent = `OK (${tag})`;
  };

  const setType = (type)=>{
    currentType = (type === 'candlestick') ? 'candlestick' : 'line';
    document.getElementById('btn-type-line').classList.toggle('active', currentType==='line');
    document.getElementById('btn-type-candle').classList.toggle('active', currentType==='candlestick');
    if (engine) engine.setType(currentType);
    document.getElementById('status').textContent = `OK (${currentType === 'candlestick' ? 'Candle' : 'Line'})`;
  };

  document.getElementById('btn-scale-linear').addEventListener('click', ()=> setScale('linear'));
  document.getElementById('btn-scale-log').addEventListener('click',    ()=> setScale('logarithmic'));
  document.getElementById('btn-type-line').addEventListener('click',    ()=> setType('line'));
  document.getElementById('btn-type-candle').addEventListener('click',  ()=> setType('candlestick'));
  document.getElementById('btn-sync').addEventListener('click', ()=> sync(engine, document.getElementById('sel-tf').value, currentScale, currentType));
  document.getElementById('sel-tf').addEventListener('change', (e)=> sync(engine, e.target.value, currentScale, currentType));

  document.getElementById('btn-table').addEventListener('click', () => {
    const rows = getCurrentRows();
    tableModal.show(rows);
    tableModal.el.querySelector('#tm-export').onclick = () => tableModal.exportCSV();
  });

  document.getElementById('btn-theme').addEventListener('click', ()=> themeManager.toggleTheme?.());
}
