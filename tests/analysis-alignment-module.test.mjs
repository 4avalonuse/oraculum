import test from 'node:test';
import assert from 'node:assert/strict';
import { alignSeries as alignFromEngine } from '../src/analysis/engine.js';
import { alignSeries as alignFromData } from '../src/analysis/data/alignment.js';

test('alignment is a dedicated module while the previous engine API remains compatible', () => {
  const day = 86400000, start = Date.UTC(2024, 0, 1);
  const series = [
    { key: 'BTC', candles: [{ timestamp: start, close: 100 }, { timestamp: start + day, close: 110 }] },
    { key: 'STOCK', candles: [{ timestamp: start + 1000, close: 50 }, { timestamp: start + day + 1000, close: 55 }] }
  ];
  assert.deepEqual(alignFromData(series, '1d'), alignFromEngine(series, '1d'));
  assert.deepEqual(alignFromEngine(series, '1d').map(row => [row.BTC, row.STOCK]), [[100, 50], [110, 55]]);
});

test('alignment does not create rows for invalid prices or unmatched calendar buckets', () => {
  const day = 86400000, start = Date.UTC(2024, 0, 1);
  const rows = alignFromData([
    { key: 'A', candles: [{ timestamp: start, close: 100 }, { timestamp: start + day, close: 0 }, { timestamp: start + 2 * day, close: 120 }] },
    { key: 'B', candles: [{ timestamp: start, close: 20 }, { timestamp: start + 2 * day, close: 24 }] }
  ], '1d');
  assert.deepEqual(rows.map(row => [row.A, row.B]), [[100, 20], [120, 24]]);
});
