import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimelineViewModes} from '../src/analysis/timeline-view-modes.js';
import {timelineLayout} from '../src/analysis/timeline-layout.js';
import {createSequentialViewport} from '../src/analysis/timeline-viewport.js';
import {synchronizeWindowFrameCounts} from '../src/analysis/timeline-duration-sync.js';
import {moveWindowByFrames,resizeWindowByFrames,matchWindowFrameCount} from '../src/analysis/timeline-window-movement.js';
import {timelineWindow} from '../src/analysis/timeline-state.js';
import {plotCoordinates} from '../src/analysis/timeline-plot-coordinates.js';
import {renderComparisonPlot} from '../src/analysis/timeline-chart-view.js';
import {createTimelinePointerHandlers} from '../src/analysis/timeline-pointer-interactions.js';

const rows=Array.from({length:40},(_,i)=>({timestamp:i*86400000,btc:100+i,other:10+i}));
test('chart and alignment toggles are independent',()=>{
 const state=createTimelineViewModes();
 state.toggleChart();assert.equal(state.chart,'calendar');assert.equal(state.alignment,'start');
 state.toggleAlignment();assert.equal(state.chart,'calendar');assert.equal(state.alignment,'sequential');
});
test('timeline movement preserves local candle duration',()=>{
 const w=timelineWindow(rows,5,14,10),moved=moveWindowByFrames(rows,w,3);
 assert.equal(moved.startIndex,8);assert.equal(moved.endIndex,17);
 assert.equal(resizeWindowByFrames(rows,w,'end',2).endIndex,16);
});
test('sequential layout clips windows without changing original samples',()=>{
 const slots=[{id:1},{id:2}];
 const layout=timelineLayout(slots,()=>rows.slice(0,30),'sequential');
 assert.equal(layout[0].visibleCount,30);assert.equal(layout[1].visibleCount,0);
 assert.equal(rows.length,40);
});
test('calendar X coordinates preserve real gaps between disjoint windows',()=>{
 const first={key:'btc1',assetKey:'BTC',slotIndex:0};
 const second={key:'btc2',assetKey:'BTC',slotIndex:1};
 const a=[{timestamp:0,btc1:100},{timestamp:86400000,btc1:120}];
 const b=[{timestamp:10*86400000,btc2:200},{timestamp:11*86400000,btc2:220}];
 const plotted=[{slot:first,rows:a},{slot:second,rows:b}];
 const output=plotCoordinates(plotted,[{capacity:2},{capacity:2}],'calendar');
 assert.equal(output.curves[0].x[0],0);
 assert.equal(output.curves[1].x[0],10/11);
 assert.equal(output.curves[1].x[1],1);
 assert.equal(output.curves[1].values[0],100);
 const relative=plotCoordinates(plotted,[{capacity:2,position:0},{capacity:2,position:0}],'relative');
 assert.equal(relative.curves[1].x[0],0);
});

test('sequential viewport reveals second timeline at unchanged frame width',()=>{
 const slots=[{id:1},{id:2}];
 const first=timelineLayout(slots,()=>rows.slice(0,20),'sequential',0);
 const next=timelineLayout(slots,()=>rows.slice(0,20),'sequential',20);
 assert.equal(first[0].visibleCount,20);
 assert.equal(first[1].visibleCount,0);
 assert.equal(next[0].visibleCount,0);
 assert.equal(next[1].visibleCount,20);
 assert.equal(next[1].position,0);
 assert.equal(next[1].capacity,20);
});

test('matching frame count keeps independent historical window',()=>{
 const primary=timelineWindow(rows,2,16,10);
 const other=timelineWindow(rows,25,34,10);
 const matched=matchWindowFrameCount(rows,other,primary.observations);
 assert.equal(matched.observations,15);
 assert.equal(matched.startIndex,25);
 assert.equal(matched.endIndex,39);
 assert.equal(matched.start,other.start);
 const shorter=matchWindowFrameCount(rows,matched,10);
 assert.equal(shorter.observations,10);
 assert.equal(shorter.startIndex,25);
});

test('sequential viewport stays within the number of available pages',()=>{
 const viewport=createSequentialViewport();
 const slots=[{id:1},{id:2}];
 const getRows=()=>rows.slice(0,20);
 assert.equal(viewport.lastPage(slots,getRows),1);
 viewport.next(slots,getRows);
 viewport.next(slots,getRows);
 assert.equal(viewport.page,1);
 assert.equal(viewport.start(slots,getRows),20);
 viewport.previous();
 assert.equal(viewport.start(slots,getRows),0);
});
test('duration synchronization respects independent starts',()=>{
 const primary={window:timelineWindow(rows,2,16,10)};
 const later={window:timelineWindow(rows,25,34,10)};
 synchronizeWindowFrameCounts([primary,later],()=>rows);
 assert.equal(later.window.startIndex,25);
 assert.equal(later.window.observations,15);
});

test('dedicated chart view labels calendar and relative axes without changing samples',()=>{
 const slot={key:'btc',assetKey:'BTC',slotIndex:0,symbol:'BTC',active:true};
 const input=[{timestamp:0,btc:100},{timestamp:86400000,btc:120}];
 const layouts=[{rows:input,capacity:2,position:0}];
 const host={clientWidth:400,innerHTML:''},legend={innerHTML:''};
 const args={host,legend,slots:[slot],layouts,assetColor:()=>'#ffffff',date:t=>String(t)};
 renderComparisonPlot({...args,mode:'calendar'});
 assert.match(host.innerHTML,/Primeira data/);
 assert.match(host.innerHTML,/Última data/);
 assert.match(legend.innerHTML,/BTC/);
 renderComparisonPlot({...args,mode:'relative'});
 assert.match(host.innerHTML,/Início relativo/);
 assert.equal(input[0].btc,100);
});

test('pointer module handles drag and completes without global listeners',()=>{
 const listeners=new Map();
 const label={firstElementChild:{textContent:''},lastElementChild:{textContent:''}};
 const track={getBoundingClientRect:()=>({width:100}),closest:()=>({querySelector:()=>label})};
 const target={
   closest:()=>track,
   addEventListener:(type,fn)=>listeners.set(type,fn),
   removeEventListener:type=>listeners.delete(type),
   setPointerCapture:()=>{},
   hasPointerCapture:()=>true,
   releasePointerCapture:()=>{}
 };
 const slot={window:timelineWindow(rows,5,14,10)};
 let completed=0;
 const handlers=createTimelinePointerHandlers({
   slots:()=>[slot],rowsForSlot:()=>rows,renderChart:()=>{},
   renderPanel:()=>{},markChanged:()=>{completed++},formatDate:String
 });
 handlers.drag({button:0,pointerId:3,clientX:10,currentTarget:target,preventDefault:()=>{}},0);
 listeners.get('pointermove')({pointerId:3,clientX:40});
 assert.equal(slot.window.startIndex,8);
 listeners.get('pointerup')({pointerId:3});
 assert.equal(completed,1);
 assert.equal(listeners.size,0);
});
