/* Pointer interaction only. All window calculations live in timeline-window-movement.js. */
import {moveWindowByFrames,resizeWindowByFrames} from './timeline-window-movement.js';
import {synchronizeWindowFrameCounts} from './timeline-duration-sync.js';

export function createTimelinePointerHandlers({slots,rowsForSlot,renderChart,renderPanel,renderSelection,markChanged,formatDate}) {
 const begin=(event,index,edge=null)=>{
   if(event.button!==undefined&&event.button!==0)return;
   const slot=slots()[index];
   if(!slot?.window?.valid)return;
   const track=event.currentTarget.closest('.cmp-timeline-track');
   if(!track)return;
   event.preventDefault();
   if(edge)event.stopPropagation();
   const pointerId=event.pointerId;
   const rows=rowsForSlot(slot);
   const original={...slot.window};
   const startX=event.clientX;
   const width=Math.max(1,track.getBoundingClientRect().width);
   const target=event.currentTarget;
   if(target.setPointerCapture&&pointerId!==undefined)target.setPointerCapture(pointerId);
   const move=ev=>{
     if(pointerId!==undefined&&ev.pointerId!==pointerId)return;
     const frames=Math.max(1,...slots().map(s=>rowsForSlot(s).length));
     const delta=Math.round((ev.clientX-startX)/width*frames);
     slot.window=edge?resizeWindowByFrames(rows,original,edge,delta):moveWindowByFrames(rows,original,delta);
     if(edge)synchronizeWindowFrameCounts(slots(),rowsForSlot);
     const label=track.closest('.cmp-timeline-row')?.querySelector('.cmp-timeline-dates');
     if(label?.firstElementChild&&label?.lastElementChild&&slot.window?.valid){
       label.firstElementChild.textContent=formatDate(slot.window.start);
       label.lastElementChild.textContent=formatDate(slot.window.end);
     }
     renderSelection?.();renderChart();
   };
   const finish=ev=>{
     if(pointerId!==undefined&&ev.pointerId!==pointerId)return;
     target.removeEventListener('pointermove',move);
     target.removeEventListener('pointerup',finish);
     target.removeEventListener('pointercancel',finish);
     if(target.hasPointerCapture?.(pointerId))target.releasePointerCapture(pointerId);
     renderPanel();renderChart();markChanged();
   };
   target.addEventListener('pointermove',move);
   target.addEventListener('pointerup',finish);
   target.addEventListener('pointercancel',finish);
 };
 return {
   drag:(event,index)=>begin(event,index),
   resize:(event,edge)=>begin(event,0,edge)
 };
}
