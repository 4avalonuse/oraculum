import test from 'node:test';
import assert from 'node:assert/strict';
import {ScientificStatus,inspectWindowSamples,inspectCalendarInference} from '../src/analysis/validation/sample-quality.js';

const day=86400000;
const rows=(start,n)=>Array.from({length:n},(_,i)=>({timestamp:start+i*day,__periodKey:new Date(start+i*day).toISOString().slice(0,10)}));
const t=Date.UTC(2024,0,1);

test('accepts independent epochs when frame counts and timestamps are valid',()=>{
  const result=inspectWindowSamples([rows(t,20),rows(t+365*day,20)]);
  assert.equal(result.status,ScientificStatus.APPROVED);
  assert.deepEqual(result.sampleSizes,[20,20]);
});
test('blocks insufficient observations, mismatched frame counts and invalid chronology',()=>{
  assert.equal(inspectWindowSamples([rows(t,9)]).status,ScientificStatus.BLOCKED);
  assert.ok(inspectWindowSamples([rows(t,20),rows(t,19)]).issues.some(x=>x.code==='FRAME_COUNT_MISMATCH'));
  const reversed=rows(t,12).reverse();
  assert.ok(inspectWindowSamples([reversed]).issues.some(x=>x.code==='INVALID_TIME_ORDER'));
});
test('does not approve cross-series inference on unpaired relative time',()=>{
  assert.equal(inspectCalendarInference({seriesCount:2,alignedRows:rows(t,12).map(({timestamp})=>({timestamp}))}).status,ScientificStatus.BLOCKED);
  assert.equal(inspectCalendarInference({seriesCount:2,alignedRows:rows(t,12)}).status,ScientificStatus.APPROVED);
  assert.equal(inspectCalendarInference({seriesCount:1,alignedRows:rows(t,12)}).status,ScientificStatus.BLOCKED);
});
