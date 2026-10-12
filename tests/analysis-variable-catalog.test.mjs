import test from 'node:test';
import assert from 'node:assert/strict';
import { VARIABLE_CATALOG, VARIABLE_BY_ID, getVariable, listVariables } from '../src/analysis/variable-catalog.js';

test('catalogue exposes stable unique IDs and complete reusable metadata', () => {
  const ids = VARIABLE_CATALOG.map(item => item.id);
  assert.ok(ids.length >= 40);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of VARIABLE_CATALOG) {
    assert.ok(item.id && /^[a-z][a-z0-9_]*$/.test(item.id), item.id);
    assert.ok(item.label && item.domain && item.unit && item.definition && item.formula && item.source, item.id);
    assert.ok(Array.isArray(item.requirements), item.id);
    assert.ok(Array.isArray(item.cautions), item.id);
    assert.equal(VARIABLE_BY_ID[item.id], item);
  }
});

test('catalogue lookup and filters return stable records without calculating values', () => {
  assert.equal(getVariable('correlation_pearson').domain, 'relationship');
  assert.equal(getVariable('not_a_metric'), null);
  assert.ok(listVariables({ domain: 'risk' }).length >= 5);
  assert.ok(listVariables({ source: 'engine.corr' }).some(item => item.id === 'correlation_pearson'));
  assert.ok(listVariables({ domain: 'does-not-exist' }).length === 0);
});

test('catalogue marks important statistical limitations explicitly', () => {
  assert.ok(getVariable('correlation_pearson').cautions.some(x => /causalidade/i.test(x)));
  assert.ok(getVariable('var_99_historical').cautions.length > 0);
  assert.ok(getVariable('lead_lag_best').cautions.length > 0);
  assert.ok(getVariable('price_real_cpi_deflated').requirements.length > 0);
});
