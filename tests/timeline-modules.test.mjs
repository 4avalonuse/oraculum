import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimelineViewModes} from '../src/analysis/timeline-view-modes.js';
import {timelineLayout} from '../src/analysis/timeline-layout.js';
import {moveWindowByFrames,resizeWindowByFrames} from '../src/analysis/timeline-window-movement.js';
import {timelineWindow} from '../src/analysis/timeline-state.js';
import {plotCoordinates} from '../src/analysis/timeline-plot-coordinates.js';

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
