import test from 'node:test';
import assert from 'node:assert/strict';
import {activeTimelineSlots,toggleTimelineActive,activeTimelineCount} from '../src/analysis/timeline-activation.js';
test('timelines iniciam ativas e podem virar referências sem perder dados',()=>{
 const original=[{key:'main',window:{start:1}},{key:'second',window:{start:2}},{key:'third',window:{start:3}}];
 const muted=toggleTimelineActive(original,1);
 assert.equal(original[1].active,undefined);
 assert.equal(muted[1].active,false);
 assert.equal(muted[1].window,original[1].window);
 assert.deepEqual(activeTimelineSlots(muted).map(s=>s.key),['main','third']);
 assert.equal(activeTimelineCount(muted),2);
 assert.equal(toggleTimelineActive(muted,1)[1].active,true);
});
test('a timeline principal permanece ativa e índices inválidos não alteram estado',()=>{
 const slots=[{key:'main'},{key:'other'}];
 assert.equal(toggleTimelineActive(slots,0),slots);
 assert.equal(toggleTimelineActive(slots,99),slots);
 assert.equal(activeTimelineCount(slots),2);
});
