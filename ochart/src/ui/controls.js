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

  document.getElementById('sel-dataset').addEventListener('change', () => {
    const selected = document.getElementById('sel-dataset').selectedOptions[0];
    const interval = selected?.dataset?.interval || '';
    const tf = document.getElementById('sel-timeframe');
    if (tf && interval) tf.value = interval;
    syncCurrent(false);
  });

  document.getElementById('sel-timeframe')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-interval]');
    if (!button) return;
    const interval = button.dataset.interval;
    const dataset = document.getElementById('sel-dataset');
    const current = dataset.selectedOptions[0];
    const provider = current?.dataset?.provider || '';
    const symbol = current?.dataset?.symbol || '';

    let option = Array.from(dataset.options).find(o =>
      o.dataset.interval === interval &&
      o.dataset.provider === provider &&
      o.dataset.symbol === symbol
    );
    if (!option) option = Array.from(dataset.options).find(o => o.dataset.interval === interval);
    if (!option) return;

    dataset.value = option.value;
    document.querySelectorAll('#sel-timeframe button').forEach(btn =>
      btn.classList.toggle('active', btn === button)
    );
    syncCurrent(false);
  });

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
