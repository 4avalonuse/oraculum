import { sync, getCurrentRows, setCandleLimit } from '../core/sync.js';
import { themeManager } from './theme-manager.js';

export function setupControls(engine, tableModal){
  let currentScale = 'linear';
  let currentType = 'line';

  const syncCurrent = (refresh = false) => {
    const id = document.getElementById('sel-dataset').value;
    if (id) return sync(engine, id, currentScale, currentType, { refresh });
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

  document.getElementById('btn-sync').addEventListener('click', () => syncCurrent(true));
  document.getElementById('sel-dataset').addEventListener('change', () => syncCurrent(false));

  document.getElementById('sel-candles').addEventListener('change', (event) => {
    setCandleLimit(event.target.value, engine);
  });

  document.getElementById('btn-table').addEventListener('click', () => {
    const rows = getCurrentRows();
    tableModal.show(rows);
    const exportButton = tableModal.el?.querySelector('#tm-export');
    if (exportButton) exportButton.onclick = () => tableModal.exportCSV();
  });

  document.getElementById('btn-theme').addEventListener('click', () => themeManager.toggleTheme?.());

  return { getScale: () => currentScale, getType: () => currentType, syncCurrent };
}
