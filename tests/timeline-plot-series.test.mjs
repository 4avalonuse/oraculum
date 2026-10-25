import test from 'node:test';
import assert from 'node:assert/strict';
import {comparisonPlotSeries,activePlotSeries} from '../src/analysis/timeline-plot-series.js';
test('referências permanecem desenháveis mas não participam das séries ativas',()=>{
 const slots=[{key:'btc',active:true},{key:'eth',active:false},{key:'sol',active:true}];
 const entries=comparisonPlotSeries(slots,slot=>[{value:1},{value:2}]);
 assert.deepEqual(entries.map(x=>x.reference),[false,true,false]);
 assert.deepEqual(activePlotSeries(entries).map(x=>x.slot.key),['btc','sol']);
});
test('séries sem observações suficientes não são desenhadas',()=>{
 const slots=[{key:'btc'},{key:'eth',active:false}];
 assert.deepEqual(comparisonPlotSeries(slots,slot=>slot.key==='btc'?[1,2]:[1]).map(x=>x.slot.key),['btc']);
});
