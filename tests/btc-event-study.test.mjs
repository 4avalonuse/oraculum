import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBtcEventWindow,formatEventStudyPct} from '../src/analysis/btc-event-study.js';
const H=3600000;
const candles=Array.from({length:10},(_,i)=>({timestamp:i*H,close:90+i*2}));
test('event window uses observed T-1h baseline and computes pre/post returns',()=>{
  const result=analyzeBtcEventWindow(candles,5*H,{toleranceMs:30*60*1000});
  assert.equal(result.available,true);
  assert.equal(result.baseline.timestamp,4*H);
  assert.equal(result.baseline.price,98);
  assert.ok(Math.abs(result.pre.returnPct-((98/92-1)*100))<1e-10);
  assert.ok(Math.abs(result.post.h1.returnPct-((102/98-1)*100))<1e-10);
  assert.ok(Math.abs(result.post.h4.returnPct-((108/98-1)*100))<1e-10);
  assert.equal(result.post.h24.returnPct,null);
});
test('insufficient observations and invalid event time fail safely',()=>{
  assert.equal(analyzeBtcEventWindow([],5*H).available,false);
  assert.equal(analyzeBtcEventWindow(candles,NaN).available,false);
});
test('formatter marks missing data explicitly',()=>{
  assert.equal(formatEventStudyPct(2.5),'+2,50%');
  assert.equal(formatEventStudyPct(-1.25),'-1,25%');
  assert.equal(formatEventStudyPct(null),'INDISPONÍVEL');
});
