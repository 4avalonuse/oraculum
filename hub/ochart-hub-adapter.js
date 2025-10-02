// hub/ochart-hub-adapter.js
/**
 * OChartHubAdapter
 * -----------------
 * Ponte entre OChart e o Hub.
 * Usa o data-loader para buscar séries e já devolve dados + stats + meta.
 */

import { fetchSeries } from '../ochart/src/core/data-loader.js';
import { sanitizeSeries, getSeriesStats } from '../ochart/src/core/sanitizer.js';

export class OChartHubAdapter {
  static async loadSeries(tf = '1d', scale = 'logarithmic') {
    try {
      const payload = await fetchSeries(tf, scale);
      const { data, stats } = sanitizeSeries(payload.data || []);
      const meta = {
        ...(payload.meta || {}),
        tf,
        scale,
        source: payload.meta?.source || 'unknown'
      };
      return { data, stats, meta };
    } catch (err) {
      console.error("❌ OChartHubAdapter.loadSeries error:", err);
      return { data: [], stats: {}, meta: { error: err.message } };
    }
  }

  static snapshot(data) {
    return getSeriesStats(data);
  }
}
