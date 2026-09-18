/**
 * OChart Data Loader
 * Fonte oficial: Oraculum Data API.
 * OChart não acessa Yahoo/Binance diretamente.
 */
const API_BASE = 'https://oraculum-data-api.4avalonuse.workers.dev/api';
const DATASETS_CACHE = 'ochart:datasets:v3';
const cacheKey = (id) => `ochart:dataset:v3:${id}`;

async function fetchJSON(url, timeoutMs = 30000, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: options.body,
      cache: 'no-store',
      signal: controller.signal
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) {
      throw new Error(`JSON malformado: ${url}`);
    }
    if (!res.ok || !json?.ok) {
      const error = new Error(json?.message || json?.error || `HTTP ${res.status}`);
      error.code = json?.code || null;
      error.provider = json?.provider || null;
      error.httpStatus = json?.httpStatus || res.status;
      throw error;
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

export async function fetchSeries(datasetId, { refresh = false } = {}) {
  if (!datasetId) throw new Error('dataset não selecionado');

  const readUrl = `${API_BASE}/datasets/${encodeURIComponent(datasetId)}`;
  const refreshUrl = `${API_BASE}/datasets/${encodeURIComponent(datasetId)}/refresh`;

  try {
    const payload = await fetchJSON(
      refresh ? refreshUrl : readUrl,
      refresh ? 60000 : 30000,
      refresh ? { method: 'POST' } : {}
    );
    try { localStorage.setItem(cacheKey(datasetId), JSON.stringify(payload)); } catch (_) {}
    payload.meta = { ...(payload.meta || {}), source: 'oraculum-api' };
    return payload;
  } catch (error) {
    if (!refresh) {
      const cached = readCachedSeries(datasetId);
      if (cached) {
        cached.meta = { ...(cached.meta || {}), source: 'cache-local' };
        return cached;
      }
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
