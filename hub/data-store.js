// hub/data-store.js
// ============================================================
// Armazena séries de dados no Hub (multi-timeframe)
// Agora exporta também setSeries() para integração com OChart.
// ============================================================

const store = new Map();

/**
 * API simples de armazenamento central
 */
const DataStore = {
  save(tf, data, stats, meta) {
    store.set(tf, {
      data,
      stats,
      meta,
      snapshot: {
        last: data[data.length - 1],
        stats
      }
    });
  },

  get(tf) {
    return store.get(tf);
  },

  all() {
    return Array.from(store.entries()).map(([tf, val]) => ({ tf, ...val }));
  }
};

/**
 * Atalho para salvar série (usado pelo OChart sync.js)
 */
export function setSeries(symbol, tf, data, meta = {}) {
  console.log(`📡 [Hub] setSeries(${symbol}, ${tf}) bars=${data.length}, source=${meta.source || 'unknown'}`);
  DataStore.save(tf, data, {}, { ...meta, symbol });
}

export default DataStore;
