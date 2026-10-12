import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSeries } from '../src/analysis/engine.js';

test('analysis pipeline computes finite risk metrics despite first aligned return being NaN', () => {
  const start = Date.UTC(2024, 0, 1), day = 86400000;
  const prices = [100, 102, 101, 104, 102, 105, 103, 108];
  const rows = prices.map((price, i) => ({ timestamp: start + i * day, BTC: price }));
  const result = analyzeSeries(rows, [{ key: 'BTC', symbol: 'BTC', name: 'Bitcoin' }], '1d');
  const s = result.series.BTC;
  for (const key of ['sharpe', 'sortino', 'downsideDeviation', 'var95', 'var99', 'es95', 'es99']) {
    assert.ok(Number.isFinite(s[key]), key + ' should be calculated from valid returns');
  }
});
