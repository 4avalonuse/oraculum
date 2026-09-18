import { fetchDatasets, fetchSeries } from './data-loader.js';
import { sanitizeLine } from './sanitizer.js';
import { pushLog } from '../ui/dev-hud.js';
import { setSeries } from '../../../hub/data-store.js';

let currentRows = [];
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

  for (const d of datasets) {
    const option = document.createElement('option');
    option.value = d.id;
    option.textContent = `${d.name} · ${d.provider}`;
    select.appendChild(option);
  }

  const requested = QS.get('dataset');
  if (requested && datasets.some(d => d.id === requested)) select.value = requested;
  return datasets;
}

export async function sync(engine, datasetId, scale, type) {
  const status = document.getElementById('status');
  status.textContent = 'Carregando…';
  try {
    const payload = await fetchSeries(datasetId);
    const { data, meta = {} } = payload;
    const result = sanitizeLine(data || [], { requirePositive: scale === 'logarithmic' });
    const rows = result.data || [];
    currentRows = rows;
    updateMeta(meta, rows);
    try { setSeries(meta.symbol || datasetId, meta.interval || 'unknown', rows, { source: meta.source || 'oraculum-api' }); } catch (_) {}

    render(engine, rows, { type, scale });
    status.textContent = `${meta.source === 'cache-local' ? 'Cache local' : 'Online'} · ${rows.length} barras`;
    pushLog({
      level: result.stats?.droppedInvalid ? 'warn' : 'info',
      msg: 'api_sync_ok',
      ts: Date.now(),
      data: { datasetId, bars: rows.length, rejected: result.stats?.droppedInvalid || 0, source: meta.source || 'oraculum-api' }
    });
  } catch (error) {
    console.error(error);
    status.textContent = 'Erro de conexão';
    pushLog({ level: 'error', msg: 'api_sync_fail', ts: Date.now(), data: { error: String(error) } });
    throw error;
  }
}

export function getCurrentRows(){ return currentRows; }
