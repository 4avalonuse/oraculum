export function createDataClient(baseUrl) {
  const root = String(baseUrl).replace(/\/$/, '');

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let response;
    try {
      response = await fetch(`${root}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...(options.headers || {}) },
        cache: 'no-store'
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('Data API timeout: ' + path);
      throw new Error('Falha de rede na Data API: ' + path);
    } finally {
      clearTimeout(timeout);
    }
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; }
    catch { throw new Error('Data API retornou JSON inválido: ' + path); }
    if (!response.ok) throw new Error(payload?.error || payload?.message || `Data API HTTP ${response.status}: ${path}`);
    return payload;
  }

  async function findDataset({ provider, symbol, interval, currency = null, kind = 'ohlcv' }) {
    const catalog = await request('/api/datasets');
    if (!catalog?.ok || !Array.isArray(catalog.data)) throw new Error('Contrato do catálogo inválido');

    const dataset = catalog.data.find(item =>
      item?.provider === provider &&
      item?.symbol === symbol &&
      item?.interval === interval &&
      item?.kind === kind &&
      (currency == null || item?.currency === currency)
    );
    if (!dataset?.id) throw new Error(`Dataset não encontrado: ${provider}/${symbol}/${interval}`);
    return dataset;
  }

  function unpack(payload, fallbackMeta) {
    if (!payload?.ok || !Array.isArray(payload.data)) throw new Error('Contrato do dataset inválido');
    return { candles: payload.data, meta: payload.meta || fallbackMeta };
  }

  return {
    async loadCandles(options) {
      const dataset = await findDataset(options);
      return unpack(await request(`/api/datasets/${encodeURIComponent(dataset.id)}`), dataset);
    },

    async loadSeries({ symbol, currency = 'USD' }) {
      const dataset = await findDataset({ provider: 'yahoo', symbol, interval: '1d', currency, kind: 'series' });
      const loaded = unpack(await request(`/api/datasets/${encodeURIComponent(dataset.id)}`), dataset);
      return {
        observations: loaded.candles.map(row => ({ timestamp: Number(row.t), value: Number(row.c) })),
        meta: loaded.meta
      };
    },

    async loadEvents() {
      const payload = await request('/api/events');
      if (!payload?.ok || !Array.isArray(payload.data)) throw new Error('Contrato de eventos inválido');
      return payload.data;
    },

    async refresh(options) {
      const dataset = await findDataset(options);
      return unpack(await request(`/api/datasets/${encodeURIComponent(dataset.id)}/refresh`, { method: 'POST' }), dataset);
    },

    async loadOrPopulate(options) {
      const loaded = await this.loadCandles(options);
      if (loaded.candles.length) return loaded;
      return this.refresh(options);
    }
  };
}
