import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseModel } from '../src/analysis/model-diagnostics.js';

const close = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);

test('Durbin–Watson matches a hand-calculated reference vector', () => {
  // e = [1, -1, 1, -1]: sum squared first differences = 12; sum e² = 4.
  const result = diagnoseModel({ available: true, residuals: [1, -1, 1, -1] });
  close(result.durbinWatson, 3, 1e-12, 'Durbin–Watson');
  close(result.residualMean, 0, 1e-12, 'residual mean');
  close(result.maxAbsResidual, 1, 1e-12, 'maximum absolute residual');
});

test('Ljung–Box matches a fixed numerical reference for a short alternating series', () => {
  // For e=[1,-1,1,-1], lag-1 ACF=-3/4 and Q(1)=n(n+2)r₁²/(n-1)=4.5.
  // Reference chi-square survival probability P(χ²₁ >= 4.5) ≈ 0.0338948535.
  const result = diagnoseModel({ available: true, residuals: [1, -1, 1, -1] });
  close(result.ljungBox.stat, 4.5, 1e-12, 'Ljung–Box Q');
  close(result.ljungBox.df, 1, 1e-12, 'Ljung–Box degrees of freedom');
  close(result.ljungBox.p, 0.0338948535, 2e-7, 'Ljung–Box p-value');
});

test('Ljung–Box does not flag a sequence with zero sample autocorrelation at tested lags', () => {
  const result = diagnoseModel({ available: true, residuals: [1, 0, -1, 0, 1, 0, -1, 0] });
  close(result.ljungBox.stat, 0, 1e-12, 'Ljung–Box Q');
  close(result.ljungBox.p, 1, 1e-12, 'Ljung–Box p-value');
});

test('unavailable models are not presented as diagnosed', () => {
  const result = diagnoseModel({ available: false });
  assert.equal(result.available, false);
  assert.match(result.reason, /não estimado/i);
});


test('irregular source intervals are flagged as descriptive-only, without suppressing numeric diagnostics', () => {
  const result = diagnoseModel({ available: true, residuals: [0.1, -0.04, 0.08, -0.02, 0.03, -0.01], auditDesign: { elapsedDaysBySeries: { BTC: [1, 1, 2, 1, 3, 1] } } });
  assert.equal(result.available, true);
  assert.equal(result.residualCount, 6);
  assert.equal(result.temporalSpacing.status, 'IRREGULAR_INTERVALS');
  assert.equal(result.temporalSpacing.formalInferenceEligible, false);
  assert.match(result.temporalSpacing.warning, /equally spaced/i);
  assert.ok(Number.isFinite(result.durbinWatson));
  assert.ok(Number.isFinite(result.ljungBox.stat));
});

test('regular intervals allow conventional timing diagnostics to be considered', () => {
  const result = diagnoseModel({ available: true, residuals: [0.1, -0.04, 0.08, -0.02, 0.03, -0.01], auditDesign: { elapsedDaysBySeries: { BTC: [1, 1, 1, 1, 1, 1] } } });
  assert.equal(result.temporalSpacing.status, 'REGULAR_INTERVALS');
  assert.equal(result.temporalSpacing.formalInferenceEligible, true);
});
