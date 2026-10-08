const API_BASE = "https://oraculum-data-api.4avalonuse.workers.dev";

function createRequest(apiBase) {
  const base = String(apiBase).replace(/\/$/, '');

  return async function request(path, options = {}) {
    const response = await fetch(base + path, {
      ...options,
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
        payload?.error ||
        payload?.message ||
        `Data API HTTP ${response.status}`
      );
    }

    return payload;
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

  function needsOhlcvRepair(loaded) {
    const candles = loaded?.candles;
    if (!Array.isArray(candles) || candles.length < 10) return false;

    // A legacy series dataset can masquerade as OHLCV by repeating its
    // single value across open/high/low/close. Never let that reach the chart.
    const collapsed = candles.reduce((count, candle) => {
      const open = Number(candle?.open ?? candle?.o);
      const high = Number(candle?.high ?? candle?.h);
      const low = Number(candle?.low ?? candle?.l);
      const close = Number(candle?.close ?? candle?.c);
      return count + (
        Number.isFinite(open) &&
        Number.isFinite(high) &&
        Number.isFinite(low) &&
        Number.isFinite(close) &&
        open === high &&
        high === low &&
        low === close
          ? 1
          : 0
      );
    }, 0);

    const scaleRatio = (a, b) => {
      if (!(a > 0) || !(b > 0)) return Infinity;
      return Math.max(a, b) / Math.min(a, b);
    };

    const edgeScaleAnomaly =
      candles.length >= 3 &&
      (
        (
          scaleRatio(Number(candles[0]?.close ?? candles[0]?.c), Number(candles[1]?.close ?? candles[1]?.c)) >= 2 &&
          scaleRatio(Number(candles[1]?.close ?? candles[1]?.c), Number(candles[2]?.close ?? candles[2]?.c)) <= 1.10
        ) ||
        (
          scaleRatio(Number(candles.at(-1)?.close ?? candles.at(-1)?.c), Number(candles.at(-2)?.close ?? candles.at(-2)?.c)) >= 2 &&
          scaleRatio(Number(candles.at(-2)?.close ?? candles.at(-2)?.c), Number(candles.at(-3)?.close ?? candles.at(-3)?.c)) <= 1.10
        )
      );

    return collapsed / candles.length >= 0.95 || edgeScaleAnomaly;
  }

  async function loadOrPopulate(options) {
    const loaded = await loadCandles(options);
    if (!loaded.candles.length || needsOhlcvRepair(loaded)) {
      return refreshCandles(options);
    }
    return loaded;
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
