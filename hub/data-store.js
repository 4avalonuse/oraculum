// hub/data-store.js v1.2
const store = new Map();

const DataStore = {
  save(tf, data, stats, meta) {
    const snapshot = { last: data[data.length - 1], stats };
    store.set(tf, { data, stats, meta, snapshot });
    console.info(`[DataStore] Série salva localmente: tf=${tf}, bars=${data.length}`);
  },

  get(tf) {
    return store.get(tf);
  },

  setSeries(symbol, tf, data, meta = {}) {
    const key = `${symbol}:${tf}`;
    const snapshot = { last: data[data.length - 1], count: data.length };
    store.set(key, { data, meta, snapshot });
    console.info(`[Hub] Série publicada: ${key}, bars=${data.length}, fonte=${meta.source || "unknown"}`);
  }
};

export default DataStore;
export const setSeries = DataStore.setSeries.bind(DataStore);
