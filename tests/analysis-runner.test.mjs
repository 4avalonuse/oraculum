import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeTimelineWindows} from '../src/analysis/analysis-runner.js';

const DAY=86400000;
const START=Date.UTC(2024,0,1);
function makeSlot(key,assetKey,offset=0){
  const candles=Array.from({length:15},(_,i)=>({timestamp:START+(i+offset)*DAY,close:100+i*2}));
  return {key,assetKey,symbol:assetKey,category:'crypto',candles};
}
function rowsFor(slot){
  return slot.candles.map(c=>({timestamp:c.timestamp,[slot.key]:c.close}));
}
function run(slots){
  const timelineRows=Object.fromEntries(slots.map(s=>[s.key,rowsFor(s)]));
  return analyzeTimelineWindows({slots,timelineRows,interval:'1d',returnMode:'log',rollingWindow:5,layouts:slots.map(()=>({visibleCount:15,duration:15,hiddenCount:0})),alignment:'start',chartMode:'relative',sameWindowDates:()=>true});
}

test('single timeline retains native statistics without inventing cross-asset inference',()=>{
  const output=run([makeSlot('btc-a','BTC')]);
  assert.equal(output.result.observations,15);
  assert.equal(output.result.series['btc-a'].nativeObservations,15);
  assert.equal(output.result.explanatoryModel.available,false);
  assert.equal(output.result.relations.length,0);
  assert.equal(output.result.temporal.sharedRows,0);
});

test('repeated asset windows remain separate but are not duplicated in multivariate models',()=>{
  const output=run([makeSlot('btc-a','BTC'),makeSlot('btc-b','BTC',20)]);
  assert.equal(output.result.observations,15);
  assert.ok(output.result.series['btc-a']);
  assert.ok(output.result.series['btc-b']);
  assert.equal(output.result.explanatoryModel.available,false);
  assert.equal(output.result.relations.length,0);
  assert.equal(output.result.temporal.sharedRows,0);
});

test('scientific runner does not mutate the supplied timeline rows',()=>{
  const slot=makeSlot('btc-a','BTC');
  const rows=rowsFor(slot);
  const before=structuredClone(rows);
  analyzeTimelineWindows({slots:[slot],timelineRows:{'btc-a':rows},interval:'1d',returnMode:'log',rollingWindow:5,layouts:[{visibleCount:15,duration:15,hiddenCount:0}],alignment:'start',chartMode:'relative',sameWindowDates:()=>true});
  assert.deepEqual(rows,before);
});
