import {needsOhlcvRepair} from './ohlcv-quality.js';
const API_BASE = "https://oraculum-data-api.4avalonuse.workers.dev";

function createRequest(apiBase) {
  const base = String(apiBase).replace(/\/$/, '');

  return async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(base + path, {
        ...options,
        signal: controller.signal,
        headers: { Accept: "application/json", ...(options.headers || {}) },
        cache: "no-store"
      });

      const text = await response.text();
      let payload = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Data API retornou JSON inválido");
      }

      if (!response.ok) {
        throw new Error(
          payload?.message ||
          payload?.error ||
          `Data API HTTP ${response.status}`
        );
      }

      return payload;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("A API não respondeu em 20 segundos. Verifique a conexão e tente Atualizar novamente.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };
}

function createClient(apiBase = API_BASE) {
  const request = createRequest(apiBase);

  async function findDataset(options) {
    const payload = await request("/api/datasets");
    const catalog = Array.isArray(payload) ? payload : payload?.data;

    if (!Array.isArray(catalog)) {
      throw new Error("Contrato do catálogo inválido");
    }

    const dataset = catalog.find(item =>
      item?.provider === options.provider &&
      item?.symbol === options.symbol &&
      item?.interval === options.interval &&
      item?.kind === (options.kind || "ohlcv") &&
      (options.currency == null || item?.currency === options.currency)
    );

    if (!dataset?.id) {
      throw new Error(
        `Dataset não encontrado: ${options.provider}/${options.symbol}/${options.interval}`
      );
    }

    return dataset;
  }

  function unpack(payload, fallbackMeta) {
    if (!payload?.ok || !Array.isArray(payload.data)) {
      throw new Error("Contrato do dataset inválido");
    }

    return {
      candles: payload.data,
      meta: payload.meta || fallbackMeta
    };
  }

  async function loadCandles(options) {
    const dataset = await findDataset(options);
    const payload = await request(
      `/api/datasets/${encodeURIComponent(dataset.id)}`
    );

    return unpack(payload, dataset);
  }


  async function loadOrPopulate(options) {
    // Opening the chart or analysis must never trigger provider ingestion.
    // D1 reads can fail when a daily quota is exhausted; automatic refreshes
    // would add writes and could repeat the outage on every page open.
    // Keep this compatibility method strictly read-only. Fresh ingestion is
    // available only through the explicit refresh button.
    const loaded = await loadCandles(options);
    return {
      ...loaded,
      qualityWarning: needsOhlcvRepair(loaded)
        ? 'A série pode precisar de revisão; use Atualizar para solicitar uma nova ingestão.'
        : null
    };
  }

  async function refreshCandles(options) {
    const dataset = await findDataset(options);
    const payload = await request(
      `/api/datasets/${encodeURIComponent(dataset.id)}/refresh`,
      { method: "POST" }
    );

    return unpack(payload, dataset);
  }

  async function loadEvents() {
    const payload = await request("/api/events");
    return Array.isArray(payload?.data) ? payload.data : [];
  }

  return { loadCandles, loadOrPopulate, refreshCandles, loadEvents };
}

const defaultClient = createClient();

export const loadCandles = defaultClient.loadCandles;
export const loadOrPopulate = defaultClient.loadOrPopulate;
export const refreshCandles = defaultClient.refreshCandles;

export function createDataClient(apiBase = API_BASE) {
  return createClient(apiBase);
}
