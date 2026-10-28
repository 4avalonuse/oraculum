import test from 'node:test';
import assert from 'node:assert/strict';
import {timelineLayout} from '../src/analysis/timeline-layout.js';

const slot=(start,end,length=100)=>({window:{valid:true,startIndex:start,endIndex:end},timelineRows:Array.from({length},(_,i)=>({timestamp:i}))});
const rows=slot=>slot.timelineRows;

test('shrinking a window shrinks its visual width without changing the historical scale',()=>{
 const before=timelineLayout([slot(10,49)],rows,'overlay')[0];
 const after=timelineLayout([slot(10,29)],rows,'overlay')[0];
 assert.equal(before.capacity,100);
 assert.equal(after.capacity,100);
 assert.equal(before.position,10);
 assert.equal(after.position,10);
 assert.equal(before.visibleCount,40);
 assert.equal(after.visibleCount,20);
});
test('moving a window moves the visual selection along its full history',()=>{
 const layout=timelineLayout([slot(60,79)],rows,'overlay')[0];
 assert.equal(layout.position,60);
 assert.equal(layout.visibleCount,20);
 assert.equal(layout.rows[0].timestamp,60);
});
test('sequential timelines use full-history offsets while preserving selected samples',()=>{
 const layouts=timelineLayout([slot(10,19),slot(20,29)],rows,'sequential',100);
 assert.equal(layouts[0].visibleCount,0);
 assert.equal(layouts[1].position,20);
 assert.equal(layouts[1].visibleCount,10);
});
