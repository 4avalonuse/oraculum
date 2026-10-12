import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSeries, sortino } from '../src/analysis/engine.js';
import { sortinoRatio } from '../src/analysis/risk.js';
import { jarqueBera } from '../src/analysis/descriptive.js';

const near = (a, b, tolerance = 1e-10) =>
  assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b)), `${a} ≈ ${b}`);

test('analysis stamps formulas, sample scope and internal identities without claiming independent validation', () => {
  const day = 86400000, start = Date.UTC(2024, 0, 1);
  const prices = [100, 102, 99, 104, 101, 107, 105, 110, 108, 115];
  const rows = prices.map((price, i) => ({ timestamp: start + i * day, BTC: price }));
  const result = analyzeSeries(rows, [{ key: 'BTC', symbol: 'BTC' }], '1d');
  const audit = result.audit;
  assert.equal(audit.mathVersion, '1.1.0');
  assert.equal(audit.sample.observations, rows.length);
  assert.equal(audit.sample.start, start);
  assert.equal(audit.sample.end, start + (rows.length - 1) * day);
  assert.equal(audit.series.BTC.calculations.totalReturn.formula, 'P_fim / P_início − 1');
  assert.equal(audit.series.BTC.calculations.totalReturn.status, 'CONSISTENT_INTERNAL');
  assert.equal(audit.series.BTC.calculations.totalReturn.independentlyValidated, false);
  assert.equal(audit.series.BTC.calculations.volatility.status, 'CONSISTENT_INTERNAL');
  assert.equal(audit.series.BTC.calculations.cagr.status, 'NOT_CHECKED');
  assert.equal(audit.status, 'INTERNAL_CHECKS_ONLY');
});

test('Sortino exported from the core and risk module uses the same downside-deviation definition', () => {
  const values = [0.02, -0.01, 0.03, -0.02, 0.01, NaN];
  near(sortino(values, 365), sortinoRatio(values, 365));
  near(sortino(values, 365), sortinoRatio(values.filter(Number.isFinite), 365));
});

test('Jarque–Bera uses classical moment skewness/kurtosis rather than adjusted descriptive estimators', () => {
  const values = [-2, -1, 0, 1, 2, 3, 4, 7, 8, 9];
  const n = values.length, mean = values.reduce((a, b) => a + b, 0) / n;
  const centered = values.map(v => v - mean);
  const m2 = centered.reduce((s, v) => s + v ** 2, 0) / n;
  const m3 = centered.reduce((s, v) => s + v ** 3, 0) / n;
  const m4 = centered.reduce((s, v) => s + v ** 4, 0) / n;
  const skew = m3 / m2 ** 1.5, excess = m4 / m2 ** 2 - 3;
  const expected = n / 6 * (skew ** 2 + excess ** 2 / 4);
  const actual = jarqueBera(values);
  near(actual.stat, expected);
  near(actual.p, Math.exp(-expected / 2));
  near(actual.skewness, skew);
  near(actual.excessKurtosis, excess);
  assert.equal(actual.method, 'classical-moment');
});

test('bivariate audit reconciles correlation, covariance, beta, alpha and R² with a separate reference calculation', () => {
  const day = 86400000, start = Date.UTC(2024, 0, 1);
  const x = [0.01, -0.02, 0.03, -0.01, 0.02, 0.015, -0.025, 0.005, 0.012, -0.008, 0.02, -0.015];
  let a = 100, b = 50;
  const rows = [{ timestamp: start, A: a, B: b }];
  for (let i = 0; i < x.length; i++) {
    a *= Math.exp(x[i]);
    b *= Math.exp(0.001 + 1.7 * x[i] + (i % 3 - 1) * 0.0007);
    rows.push({ timestamp: start + (i + 1) * day, A: a, B: b });
  }
  const result = analyzeSeries(rows, [
    { key: 'A', symbol: 'A' }, { key: 'B', symbol: 'B' }
  ], '1d');
  const stamp = result.audit.relations[0];
  assert.equal(stamp.status, 'CONSISTENT_INTERNAL');
  assert.equal(stamp.independentlyValidated, false);
  assert.equal(stamp.checks.length, 6);
  assert.ok(stamp.checks.every(item => item.status === 'PASS'), JSON.stringify(stamp.checks));
});
