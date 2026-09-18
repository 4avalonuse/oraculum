import { syncSelected, getDatasetForInterval, getCurrentRows, setCandleLimit } from '../core/sync.js';
import { themeManager } from './theme-manager.js';

function readAvailable(select) {
  const selected = select?.selectedOptions?.[0];
  if (!selected?.dataset?.datasets) return {};
  try {
    const parsed = JSON.parse(selected.dataset.datasets);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

export function setupControls(engine, tableModal){
  let currentScale = 'linear';
  let currentType = 'line';
  let currentInterval = '1h';

  const syncCurrent = (refresh = false) =>
    syncSelected(engine, currentScale, currentType, {
      refresh,
      interval: currentInterval
    });

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

  const syncIntervalButtons = (preferred = currentInterval) => {
    const available = readAvailable(document.getElementById('sel-dataset'));
    const fallbackOrder = ['1h', '1d', '1w', '1M', '1m'];
    currentInterval = available[preferred]
      ? preferred
      : (fallbackOrder.find((value) => available[value]) || preferred);

    document.querySelectorAll('#sel-timeframe button[data-interval]').forEach(btn => {
      const enabled = Boolean(available[btn.dataset.interval]);
      btn.disabled = !enabled;
      btn.classList.toggle('active', enabled && btn.dataset.interval === currentInterval);
    });

    return currentInterval;
  };

  const setInterval = (interval) => {
    if (!getDatasetForInterval(interval)) return false;
    currentInterval = interval;
    syncIntervalButtons(interval);
    return true;
  };

  document.getElementById('btn-scale-linear').addEventListener('click', () => setScale('linear'));
  document.getElementById('btn-scale-log').addEventListener('click', () => setScale('logarithmic'));
  document.getElementById('btn-type-line').addEventListener('click', () => setType('line'));
  document.getElementById('btn-type-candle').addEventListener('click', () => setType('candlestick'));

  document.getElementById('btn-sync').addEventListener('click', async () => {
    const button = document.getElementById('btn-sync');
    button.disabled = true;
    button.classList.add('loading');
    try {
      await syncCurrent(true);
    } finally {
      button.disabled = false;
      button.classList.remove('loading');
    }
  });

  document.getElementById('sel-dataset').addEventListener('change', async () => {
    const interval = syncIntervalButtons();
    await syncCurrent(false);
    if (interval !== currentInterval) syncIntervalButtons(interval);
  });

  document.getElementById('sel-timeframe')?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-interval]');
    if (!button || button.disabled) return;
    const interval = button.dataset.interval;
    if (!setInterval(interval)) return;
    await syncCurrent(false);
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

  return {
    getScale: () => currentScale,
    getType: () => currentType,
    getInterval: () => currentInterval,
    setInterval,
    refreshIntervalButtons: syncIntervalButtons,
    syncCurrent
  };
}
