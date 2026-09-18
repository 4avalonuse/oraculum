import { fetchSeries } from '../ochart/src/core/data-loader.js';
import { sanitizeLine, getSeriesStats } from '../ochart/src/core/sanitizer.js';

const DATASETS = {
  '1d': 'btc-usd-yahoo',
  '1h': 'btc-usdt-binance'
};

export class OChartHubAdapter {
  static async loadSeries(tf = '1d', scale = 'linear') {
    try {
      const datasetId = DATASETS[tf] || tf;
      const payload = await fetchSeries(datasetId);
      const { data, stats } = sanitizeLine(payload.data || [], {
        requirePositive: scale !== 'linear'
      });
      const meta = {
        ...(payload.meta || {}),
        tf,
        scale,
        datasetId,
        source: payload.meta?.source || 'unknown'
      };
      return { data, stats, meta };
    } catch (err) {
      console.error('OChartHubAdapter.loadSeries error:', err);
      return { data: [], stats: {}, meta: { error: err.message, tf, scale } };
    }
  }

  static snapshot(data) {
    return getSeriesStats(data);
  }
}
