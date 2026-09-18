import { fetchDatasets, fetchSeries } from './data-loader.js';
import { sanitizeLine } from './sanitizer.js';
import { OffsetWindow } from '../ui/offset-window.js';
import { pushLog } from '../ui/dev-hud.js';
import { setSeries } from '../../../hub/data-store.js';

let fullRows = [];
let currentRows = [];
let ow = null;

function formatPrice(value) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function sliceByOffsets(rows, finish, start) {
  const n = rows.length;
  if (!n) return { data: [] };
  const max = Math.max(0, n - 1);
  const F = Math.min(Math.max(0, finish | 0), max);
  const S = Math.min(Math.max(0, start | 0), max);
  const left = Math.max(F, S), right = Math.min(F, S);
  return { data: rows.slice(Math.max(0, n - 1 - left), Math.min(n - 1, n - 1 - right) + 1) };
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
export async function sync(engine, datasetId, tf, scale, type) {
  const status = document.getElementById('status');
  status.textContent = 'Carregando…';
  try {
    const payload = await fetchSeries(datasetId);
    const { data, meta = {} } = payload;
    const { candles, rejected } = sanitizeLine(data || [], { requirePositive: scale === 'logarithmic' });
    fullRows = candles;
    updateMeta(meta, candles);
    try { setSeries(meta.symbol || datasetId, tf, candles, { source: 'oraculum-api' }); } catch (_) {}

    const max = Math.max(0, candles.length - 1);
    if (!ow) {
      ow = new OffsetWindow(document.getElementById('ow'), {
        max, finish: max, start: 0,
        onApply: ({ finish, start }) => render(engine, sliceByOffsets(fullRows, finish, start).data, { type, scale })
      });
    } else {
      ow.setMax(max);
      ow.setWindow({ finish: max, start: 0 });
    }
    const sliced = sliceByOffsets(candles, max, 0).data;
    render(engine, sliced, { type, scale });
    status.textContent = `Online · ${candles.length} barras`;
    pushLog({ level: rejected?.length ? 'warn' : 'info', msg: 'api_sync_ok', ts: Date.now(), data: { datasetId, bars: candles.length, rejected: rejected?.length || 0 } });
  } catch (error) {
    console.error(error);
    status.textContent = 'Erro de conexão';
    pushLog({ level: 'error', msg: 'api_sync_fail', ts: Date.now(), data: { error: String(error) } });
    alert('Não foi possível carregar o dataset. ' + error.message);
  }
}
export function getCurrentRows(){ return currentRows; }
