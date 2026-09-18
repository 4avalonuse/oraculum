import { OChartHubAdapter } from './ochart-hub-adapter.js';
import Bus from './bus.js';
import DataStore from './data-store.js';

export const Hub = {
  async init(tf = '1d') {
    const { data, stats, meta } = await OChartHubAdapter.loadSeries(tf);
    DataStore.save(tf, data, stats, meta);
    Bus.emit('series:loaded', { tf, data, stats, meta });
  },

  getSeries(tf = '1d') {
    return DataStore.get(tf)?.data || [];
  },

  getSnapshot(tf = '1d') {
    return DataStore.get(tf)?.snapshot || {};
  },

  on: Bus.on
};
