import { sync, getCurrentRows } from '../core/sync.js';
import { themeManager } from './theme-manager.js';

export function setupControls(engine, tableModal){
  let currentScale = 'linear';
  let currentType = 'line';

  const syncCurrent = () => {
    const id = document.getElementById('sel-dataset').value;
    const tf = document.getElementById('sel-tf').value;
    if (id) sync(engine, id, tf, currentScale, currentType);
  };

  const setScale = (scale) => {
    currentScale = scale === 'logarithmic' ? 'logarithmic' : 'linear';
    document.getElementById('btn-scale-linear').classList.toggle('active', currentScale === 'linear');
    document.getElementById('btn-scale-log').classList.toggle('active', currentScale === 'logarithmic');
    engine?.setScale(currentScale);
  };

  const setType = (type) => {
    currentType = type === 'candlestick' ? 'candlestick' : 'line';
    document.getElementById('btn-type-line').classList.toggle('active', currentType === 'line');
    document.getElementById('btn-type-candle').classList.toggle('active', currentType === 'candlestick');
    engine?.setType(currentType);
  };

  document.getElementById('btn-scale-linear').addEventListener('click', () => setScale('linear'));
  document.getElementById('btn-scale-log').addEventListener('click', () => setScale('logarithmic'));
  document.getElementById('btn-type-line').addEventListener('click', () => setType('line'));
  document.getElementById('btn-type-candle').addEventListener('click', () => setType('candlestick'));
  document.getElementById('btn-sync').addEventListener('click', syncCurrent);
  document.getElementById('sel-dataset').addEventListener('change', syncCurrent);
  document.getElementById('sel-tf').addEventListener('change', syncCurrent);

  document.getElementById('btn-table').addEventListener('click', () => {
    const rows = getCurrentRows();
    tableModal.show(rows);
    tableModal.el.querySelector('#tm-export').onclick = () => tableModal.exportCSV();
  });

  document.getElementById('btn-theme').addEventListener('click', () => themeManager.toggleTheme?.());

  return { getScale: () => currentScale, getType: () => currentType, syncCurrent };
}
