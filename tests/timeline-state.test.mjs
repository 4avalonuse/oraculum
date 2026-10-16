import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestTimelineIndex,timelineWindow,shiftTimelineWindow,resizeTimelineWindow,resizeTimelineDuration,timelineWindowLabel,timelineAssetKeys} from '../src/analysis/timeline-state.js';

const day=86400000;
const candles=(start,count,step=day)=>Array.from({length:count},(_,i)=>({timestamp:start+i*step,close:100+i}));
const t=Date.UTC(2024,0,1);

test('window clamps indexes, preserves ordered endpoints and enforces minimum observations',()=>{
  const rows=candles(t,12);
  const w=timelineWindow(rows,10,2,5);
  assert.equal(w.startIndex,2);
  assert.equal(w.endIndex,10);
  assert.equal(w.observations,9);
  const short=timelineWindow(rows,11,11,3);
  assert.equal(short.endIndex,11);
  assert.equal(short.startIndex,9);
  assert.equal(short.valid,true);
});

test('nearest timestamp lookup selects the closest actual candle',()=>{
  const rows=candles(t,4);
  assert.equal(nearestTimelineIndex(rows,t+1.4*day),1);
  assert.equal(nearestTimelineIndex(rows,t+1.6*day),2);
  assert.equal(nearestTimelineIndex([],t),-1);
});

test('comparison timeline shifts independently while preserving approximate duration',()=>{
  const rows=candles(t,30);
  const base=timelineWindow(rows,4,13,5);
  const moved=shiftTimelineWindow(rows,base,5*day,5);
  assert.equal(moved.startIndex,9);
  assert.equal(moved.endIndex,18);
  assert.equal(moved.observations,base.observations);
  const left=shiftTimelineWindow(rows,moved,-100*day,5);
  assert.equal(left.startIndex,0);
  assert.equal(left.endIndex,9);
});

test('resizing either edge preserves the opposite edge and minimum length',()=>{
  const rows=candles(t,20);
  const base=timelineWindow(rows,5,12,4);
  const shorter=resizeTimelineWindow(rows,base,'start',2*day,4);
  assert.equal(shorter.endIndex,base.endIndex);
  assert.equal(shorter.startIndex,7);
  const longer=resizeTimelineWindow(rows,base,'end',4*day,4);
  assert.equal(longer.startIndex,base.startIndex);
  assert.equal(longer.endIndex,16);
  const min=resizeTimelineWindow(rows,base,'end',-100*day,4);
  assert.equal(min.observations,4);
});

test('window labels make the selected absolute dates explicit',()=>{
  const w=timelineWindow(candles(t,5),1,3);
  assert.equal(timelineWindowLabel(w,ms=>new Date(ms).toISOString().slice(0,10)),'2024-01-02 → 2024-01-04');
});

test('comparison windows inherit the main window duration while keeping their own epoch',()=>{
  const rows=candles(t,40);
  const comparison=timelineWindow(rows,20,25,4);
  const synced=resizeTimelineDuration(rows,comparison,10*day,4);
  assert.equal(synced.startIndex,20);
  assert.equal(synced.endIndex,30);
  assert.equal(synced.durationMs,10*day);
});

test('timeline asset list grows with every selected series and permits later repeated assets',()=>{
  const selected=['ETH','SOL','GOLD','DXY','ETH','BTC'];
  assert.deepEqual(timelineAssetKeys('BTC',selected),['BTC','ETH','SOL','GOLD','DXY']);
  assert.deepEqual(timelineAssetKeys('BTC',[]),['BTC']);
});
