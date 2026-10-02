const API_BASE = "https://oraculum-data-api.4avalonuse.workers.dev";

async function request(path, options = {}) {
  const response = await fetch(API_BASE + path, {
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
}

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

export async function loadCandles(options) {
  const dataset = await findDataset(options);
  const payload = await request(
    `/api/datasets/${encodeURIComponent(dataset.id)}`
  );

  return unpack(payload, dataset);
}

export async function loadOrPopulate(options) {
  const loaded = await loadCandles(options);
  if (loaded.candles.length) return loaded;
  return refreshCandles(options);
}

export async function refreshCandles(options) {
  const dataset = await findDataset(options);
  const payload = await request(
    `/api/datasets/${encodeURIComponent(dataset.id)}/refresh`,
    { method: "POST" }
  );

  return unpack(payload, dataset);
}


export function createDataClient(apiBase = API_BASE) {
  const base = String(apiBase).replace(/\\\/$/, '');
  const scopedRequest = (path, options = {}) => request(path, options);
  // Keep the public client contract explicit while reusing the module's API implementation.
  // The current request helper uses API_BASE, so temporarily route the default contract only.
  if (base !== API_BASE) {
    throw new Error('Data client: API base customizada não suportada neste núcleo');
  }
  return { loadCandles, loadOrPopulate, refreshCandles };
}
