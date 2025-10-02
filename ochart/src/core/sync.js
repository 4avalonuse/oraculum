// src/core/sync.js v1.5
import { fetchSeries } from './data-loader.js';
import { sanitizeLine } from './sanitizer.js';
import { OffsetWindow } from '../ui/offset-window.js';
import { pushLog } from '../ui/dev-hud.js';

import { setSeries } from '../../../hub/data-store.js';
// import DataStore from '../../../hub/data-store.js';

let fullRows = [];
let currentRows = [];
let ow = null;

const $ = (sel) => document.querySelector(sel);

function formatPrice(value) {
  if (!Number.isFinite(value)) return '—';
  return Math.round(value).toLocaleString('en-US');
}

function sliceByOffsets(rows, finish, start) {
  const n = rows.length;
  if (!n) return { data: [], a: 0, b: 0, left: 0, right: 0 };
  const max = Math.max(0, n - 1);
  const F = Math.min(Math.max(0, finish | 0), max);
  const S = Math.min(Math.max(0, start | 0), max);
  const left = Math.max(F, S);
  const right = Math.min(F, S);
  const idxStart = (n - 1) - left;
  const idxEnd   = (n - 1) - right;
  const a = Math.max(0, Math.min(idxStart, idxEnd));
  const b = Math.max(0, Math.max(idxStart, idxEnd));
  return { data: rows.slice(a, b + 1), a, b, left, right };
}

function render(engine, rows, { type, scale }) {
  engine.create(rows, { type, scale });
  currentRows = rows.slice();
  const last = rows[rows.length - 1];
  const highs = rows.map(r => r.h).filter(Number.isFinite);
  const lows  = rows.map(r => r.l).filter(Number.isFinite);
  document.getElementById('k-close').textContent = formatPrice(last?.c);
  document.getElementById('k-max').textContent   = highs.length ? formatPrice(Math.max(...highs)) : '—';
  document.getElementById('k-min').textContent   = lows.length  ? formatPrice(Math.min(...lows)) : '—';
}

export async function sync(engine, tf, scale, type) {
  const $status = document.getElementById('status');
  $status.textContent = 'Carregando...';
  pushLog({ level: 'info', msg: 'sync_start', ts: Date.now(), data: { tf, scale, type } });

  try {
    const payload = await fetchSeries(tf, scale);
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const meta = payload?.meta || {};

    const { data: rows, stats } = sanitizeLine(data, { requirePositive: scale === 'logarithmic' });
    fullRows = rows;

    if (stats) {
      pushLog({ level: (stats.droppedInvalid > 0 ? 'warn' : 'info'), msg: 'sanitize_report_front', ts: Date.now(), data: stats });
    }

    try {
      setSeries('BTC-USD', tf, rows, { source: meta.source || 'unknown' });
      console.info(`[Sync] Série enviada ao Hub: tf=${tf}, barras=${rows.length}`);
    } catch (hubErr) {
      console.warn("⚠️ [Sync] Falha ao publicar no Hub.", hubErr);
      // DataStore.save(tf, rows, stats, meta);
    }

    const max = Math.max(0, rows.length - 1);
    if (!ow) {
      ow = new OffsetWindow(document.getElementById('ow'), {
        max, finish: max, start: 0,
        onApply: ({ max, finish, start }) => {
          const sliced = sliceByOffsets(fullRows, finish, start);
          render(engine, sliced.data, { type, scale });
          $status.textContent = `OK (janela: ${sliced.data.length})`;
        }
      });
    } else {
      ow.setMax(max);
      ow.setWindow({ finish: max, start: 0 });
    }

    const sliced = sliceByOffsets(rows, Math.max(0, rows.length - 1), 0);
    render(engine, sliced.data, { type, scale });

    const src = meta?.source || (meta?.sanitized ? 'php' : 'static');
    $status.textContent = `OK (${scale === 'logarithmic' ? 'Log' : 'Linear'} | fonte: ${src})`;
    pushLog({ level: 'info', msg: 'sync_ok', ts: Date.now(), data: { bars: rows.length, scale, type, source: src } });
  } catch (e) {
    console.error(e);
    $status.textContent = 'Falha';
    pushLog({ level: 'error', msg: 'sync_fail', ts: Date.now(), data: { error: String(e) } });
    alert('Erro: ' + e.message);
  }
}

export function getCurrentRows() {
  return currentRows;
}
