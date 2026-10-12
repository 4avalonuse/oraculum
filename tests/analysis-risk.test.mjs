import test from 'node:test';
import assert from 'node:assert/strict';
import { riskMetrics, sharpeRatio, sortinoRatio, historicalVaR, expectedShortfall } from '../src/analysis/risk.js';

test('risk metrics ignore intentional NaN gaps in aligned return series', () => {
  const aligned = [NaN, 0.02, -0.01, 0.03, -0.02, NaN, 0.01];
  const clean = [0.02, -0.01, 0.03, -0.02, 0.01];
  const a = riskMetrics(aligned, 365);
  const b = riskMetrics(clean, 365);
  for (const key of ['sharpe','sortino','downsideDeviation','var95','var99','es95','es99']) {
    assert.ok(Number.isFinite(a[key]), key + ' should be finite for this fixture');
    assert.equal(a[key], b[key], key + ' should ignore invalid observations');
  }
});

test('individual risk metrics filter non-finite observations and reject invalid settings', () => {
  const values = [NaN, 0.02, -0.01, Infinity, 0.03, -0.02];
  assert.equal(sharpeRatio(values, 365), sharpeRatio([0.02, -0.01, 0.03, -0.02], 365));
  assert.equal(sortinoRatio(values, 365), sortinoRatio([0.02, -0.01, 0.03, -0.02], 365));
  assert.ok(Number.isNaN(historicalVaR(values, 1)));
  assert.ok(Number.isNaN(historicalVaR(values, 0)));
  assert.ok(Number.isNaN(expectedShortfall(values, 1)));
});
