import test from 'node:test';
import assert from 'node:assert/strict';
import {EligibilityStatus,inspectTimelineContext,evaluateMethodEligibility} from '../src/analysis/validation/method-eligibility.js';
const day=86400000;
const dates=(start,n)=>Array.from({length:n},(_,i)=>start+i*day);
const ctx=(a,b)=>inspectTimelineContext([{id:'BTC-1',timestamps:a},{id:'ETH-1',timestamps:b}],{minimumObservations:5});

test('correlação contemporânea exige datas efetivamente comuns',()=>{
  const c=ctx(dates(0,8),dates(30*day,8));
  assert.equal(c.commonObservations,0);
  assert.deepEqual(evaluateMethodEligibility(c,'contemporaneous_correlation'),{
    status:EligibilityStatus.INADEQUATE,reasons:['INSUFFICIENT_ALIGNED_OBSERVATIONS']
  });
  assert.equal(evaluateMethodEligibility(c,'relative_trajectory').status,EligibilityStatus.CAUTION);
});
test('correlação é elegível com amostras alinhadas suficientes',()=>{
  const c=ctx(dates(0,8),dates(3*day,8));
  assert.equal(c.commonObservations,5);
  assert.equal(evaluateMethodEligibility(c,'contemporaneous_correlation').status,EligibilityStatus.ADEQUATE);
});
test('timelines inativas não entram na elegibilidade',()=>{
  const c=inspectTimelineContext([{timestamps:dates(0,8)},{timestamps:dates(30*day,8),active:false}],{minimumObservations:5});
  assert.equal(c.activeCount,1);
  assert.deepEqual(evaluateMethodEligibility(c,'contemporaneous_correlation').reasons,['REQUIRES_TWO_TIMELINES']);
});
test('datas duplicadas exigem ressalva, sem duplicar amostras',()=>{
  const c=ctx([...dates(0,8),0],dates(0,8));
  assert.equal(c.series[0].observations,8);
  assert.equal(evaluateMethodEligibility(c,'contemporaneous_correlation').status,EligibilityStatus.CAUTION);
});
test('método desconhecido nunca recebe aprovação',()=>{
  assert.equal(evaluateMethodEligibility(ctx(dates(0,8),dates(0,8)),'causality').status,EligibilityStatus.INADEQUATE);
});
