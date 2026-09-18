/**
 * OChart Data Loader
 * Fonte oficial: Oraculum Data API.
 * OChart não acessa Yahoo/Binance diretamente.
 */
const API_BASE = 'https://oraculum-data-api.4avalonuse.workers.dev/api';
const QS = new URLSearchParams(location.search);
const DATASETS_CACHE = 'ochart:datasets';
const cacheKey = (id) => `ochart:dataset:${id}`;

async function fetchJSON(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) {
      throw new Error(`JSON malformado: ${url}`);
    }
    if (!res.ok || !json?.ok) {
      throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
    }
    return json;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('tempo limite da Data API');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDatasets() {
  try {
    const payload = await fetchJSON(`${API_BASE}/datasets`);
    const data = Array.isArray(payload.data) ? payload.data : [];
    try { localStorage.setItem(DATASETS_CACHE, JSON.stringify(data)); } catch (_) {}
    return data;
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem(DATASETS_CACHE) || 'null');
      if (Array.isArray(cached) && cached.length) return cached;
    } catch (_) {}
    throw error;
  }
}

export async function fetchSeries(datasetId) {
  if (!datasetId) throw new Error('dataset não selecionado');
  try {
    const payload = await fetchJSON(`${API_BASE}/datasets/${encodeURIComponent(datasetId)}`);
    try { localStorage.setItem(cacheKey(datasetId), JSON.stringify(payload)); } catch (_) {}
    payload.meta = { ...(payload.meta || {}), source: 'oraculum-api' };
    return payload;
  } catch (error) {
    const cached = readCachedSeries(datasetId);
    if (cached) {
      cached.meta = { ...(cached.meta || {}), source: 'cache-local' };
      return cached;
    }
    throw error;
  }
}

export function readCachedSeries(datasetId) {
  try {
    const value = localStorage.getItem(cacheKey(datasetId));
    return value ? JSON.parse(value) : null;
  } catch (_) { return null; }
}

export { API_BASE };
