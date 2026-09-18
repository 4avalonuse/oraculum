import { fetchDatasets, fetchSeries } from './data-loader.js';
import { sanitizeLine } from './sanitizer.js';
import { pushLog } from '../ui/dev-hud.js';
import { setSeries, setAnalysisPeriods as publishAnalysisPeriods } from '../../../hub/data-store.js';

let currentRows = [];
let fullRows = [];
let periodController = null;
let currentConfig = { scale: 'linear', type: 'line' };
let candleLimit = 1000;
const QS = new URLSearchParams(location.search);

function formatPrice(value) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function updateMeta(meta, rows) {
  document.getElementById('dataset-name').textContent = meta.name || meta.symbol || 'Dataset';
  document.getElementById('dataset-meta').textContent = [meta.symbol, meta.kind, meta.interval].filter(Boolean).join(' · ');
  document.getElementById('k-provider').textContent = meta.provider || '—';
  document.getElementById('k-interval').textContent = meta.interval || '—';
  document.getElementById('k-currency').textContent = meta.currency || '—';
  document.getElementById('k-bars').textContent = String(rows.length);
  document.getElementById('k-updated').textContent = meta.updatedAt ? new Date(meta.updatedAt).toLocaleString('pt-BR') : '—';
}

function applyCandleLimit(rows) {
  if (!Number.isFinite(candleLimit) || candleLimit <= 0) return rows.slice();
  return rows.length > candleLimit ? rows.slice(-candleLimit) : rows.slice();
}

function getVisibleRows() {
  const periodRows = periodController ? periodController.filter(fullRows) : fullRows.slice();
  return applyCandleLimit(periodRows);
}

function render(engine, rows, config) {
  engine.create(rows, config);
  currentRows = rows.slice();
  const last = rows.at(-1);
  const highs = rows.map(r => r.h).filter(Number.isFinite);
  const lows = rows.map(r => r.l).filter(Number.isFinite);
  document.getElementById('k-close').textContent = formatPrice(last?.c);
  document.getElementById('k-max').textContent = highs.length ? formatPrice(Math.max(...highs)) : '—';
  document.getElementById('k-min').textContent = lows.length ? formatPrice(Math.min(...lows)) : '—';
}

export async function loadDatasets() {
  const datasets = await fetchDatasets();
  const select = document.getElementById('sel-dataset');
  select.innerHTML = '';

  // The selector represents a market, not an individual interval.
  // Interval-specific dataset ids stay internal to OChart.
  const markets = new Map();
  for (const d of datasets) {
    const key = `${d.provider}:${d.symbol}`;
    if (!markets.has(key)) {
      markets.set(key, {
        key,
        provider: d.provider || '',
        symbol: d.symbol || '',
        name: d.provider === 'yahoo' ? 'Bitcoin / USD' : 'Bitcoin / USDT',
        datasets: new Map()
      });
    }
    markets.get(key).datasets.set(d.interval || '', d);
  }

  for (const market of markets.values()) {
    const option = document.createElement('option');
    option.value = market.key;
    option.textContent = market.name;
    option.dataset.provider = market.provider;
    option.dataset.symbol = market.symbol;
    option.dataset.datasets = JSON.stringify(Object.fromEntries(market.datasets));
    select.appendChild(option);
  }

  const requested = QS.get('dataset');
  const requestedDataset = datasets.find(d => d.id === requested);
  if (requestedDataset) {
    const key = `${requestedDataset.provider}:${requestedDataset.symbol}`;
    if (Array.from(select.options).some(o => o.value === key)) select.value = key;
  }

  return datasets;
}

export function getDatasetForInterval(interval) {
  const select = document.getElementById('sel-dataset');
  const market = select?.selectedOptions?.[0];
  if (!market?.dataset?.datasets) return null;

  try {
    const map = JSON.parse(market.dataset.datasets);
    return map[interval] || null;
  } catch (_) {
    return null;
  }
}

export function syncSelected(engine, scale, type, { refresh = false, interval = null } = {}) {
  const select = document.getElementById('sel-dataset');
  const market = select?.selectedOptions?.[0];
  if (!market) return Promise.resolve();

  const desired = interval || market.dataset.interval || '1d';
  const dataset = getDatasetForInterval(desired) || getDatasetForInterval('1d') || Object.values(JSON.parse(market.dataset.datasets || '{}'))[0];
  if (!dataset) return Promise.resolve();

  select.dataset.activeDataset = dataset.id;
  return sync(engine, dataset.id, scale, type, { refresh });
}

export async function sync(engine, datasetId, scale, type, { refresh = false } = {}) {
  currentConfig = { scale, type };
  const status = document.getElementById('status');
  status.textContent = refresh ? 'Atualizando…' : 'Carregando…';

  try {
    const payload = await fetchSeries(datasetId, { refresh });
    const { data, meta = {} } = payload;
    const result = sanitizeLine(data || [], { requirePositive: scale === 'logarithmic' });
    const rows = result.data || [];
    fullRows = rows;

    if (periodController) periodController.setDataset(datasetId, rows);

    const visibleRows = getVisibleRows();
    render(engine, visibleRows, { type, scale });
    updateMeta(meta, visibleRows);

    try {
      setSeries(meta.symbol || datasetId, meta.interval || 'unknown', rows, {
        source: meta.source || 'oraculum-api'
      });
    } catch (_) {}

    status.textContent = `${meta.source === 'cache-local' ? 'Cache local' : 'Online'} · ${visibleRows.length} barras`;

    pushLog({
      level: result.stats?.droppedInvalid ? 'warn' : 'info',
      msg: refresh ? 'api_refresh_ok' : 'api_sync_ok',
      ts: Date.now(),
      data: {
        datasetId,
        bars: visibleRows.length,
        totalBars: rows.length,
        rejected: result.stats?.droppedInvalid || 0,
        source: meta.source || 'oraculum-api'
      }
    });
  } catch (error) {
    console.error(error);
    status.textContent = 'Erro de conexão';
    pushLog({
      level: 'error',
      msg: refresh ? 'api_refresh_fail' : 'api_sync_fail',
      ts: Date.now(),
      data: { error: String(error) }
    });
    throw error;
  }
}

export function setCandleLimit(limit, engine) {
  const value = Number(limit);
  candleLimit = Number.isFinite(value) && value > 0 ? value : Infinity;
  const rows = getVisibleRows();
  render(engine, rows, currentConfig);
  document.getElementById('k-bars').textContent = String(rows.length);
  return rows.length;
}

export function getCurrentRows(){ return currentRows; }

export function setAnalysisPeriods(controller, engine) {
  periodController = controller || null;
  if (!periodController) return;

  publishAnalysisPeriods(periodController.get());

  periodController.onChange = (state) => {
    publishAnalysisPeriods(state);
    const rows = getVisibleRows();
    render(engine, rows, currentConfig);
    currentRows = rows.slice();
    document.getElementById('k-bars').textContent = String(rows.length);
  };
}
