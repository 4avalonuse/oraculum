/**
 * OChart Data Loader
 * Fonte oficial: Oraculum Data API.
 * OChart não acessa Yahoo/Binance diretamente.
 */
const API_BASE = 'https://oraculum-data-api.4avalonuse.workers.dev/api';
const QS = new URLSearchParams(location.search);
const cacheKey = (id) => `ochart:dataset:${id}`;

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {
    throw new Error(`JSON malformado: ${url}`);
  }
  if (!res.ok || !json?.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function fetchDatasets() {
  const payload = await fetchJSON(`${API_BASE}/datasets`);
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function fetchSeries(datasetId) {
  if (!datasetId) throw new Error('dataset não selecionado');
  const payload = await fetchJSON(`${API_BASE}/datasets/${encodeURIComponent(datasetId)}`);
  try { localStorage.setItem(cacheKey(datasetId), JSON.stringify(payload)); } catch (_) {}
  payload.meta = { ...(payload.meta || {}), source: 'oraculum-api' };
  return payload;
}

export function readCachedSeries(datasetId) {
  try {
    const value = localStorage.getItem(cacheKey(datasetId));
    return value ? JSON.parse(value) : null;
  } catch (_) { return null; }
}

export { API_BASE };
