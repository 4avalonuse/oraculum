import {alignSeries} from './engine.js';
import {nearestTimelineIndex,timelineWindow} from './timeline-state.js';

/* Operações sobre janelas e linhas de timelines; independentes da interface. */
export const timelineRowsFor=slot=>Array.isArray(slot?.timelineRows)?slot.timelineRows:[];
export const rowsInWindow=slot=>{
  const w=slot?.window,rows=timelineRowsFor(slot);
  if(!w?.valid)return [];
  const start=Math.max(0,Number(w.startIndex)||0),end=Math.min(rows.length-1,Number(w.endIndex)||0);
  return rows.slice(start,end+1);
};
export const periodKeyFor=row=>row?.__periodKey||row?.timestamp;
export function makeTimelineSlot(asset,index,interval){
  const slot={...asset,key:'timeline-'+index,assetKey:asset.assetKey||asset.key,slotIndex:index,active:true};
  slot.timelineRows=alignSeries([slot],interval);
  return slot;
}
export function startTimelineWindow(slot,start,end,min=10){
  const rows=timelineRowsFor(slot);
  if(!rows.length)return timelineWindow(rows,0,0,min);
  const a=nearestTimelineIndex(rows,start),b=nearestTimelineIndex(rows,end);
  return timelineWindow(rows,a<0?0:a,b<0?rows.length-1:b,min);
}
export function sharedTimelineRows(slots,interval){
  return slots.length>1?alignSeries(slots.map(slot=>({...slot,key:slot.key})),interval):timelineRowsFor(slots[0]);
}
export function setSharedTimelineWindow(slots,interval,startIndex,count){
  const common=sharedTimelineRows(slots,interval);
  if(!slots.length||!common.length)return;
  const size=Math.min(common.length,Math.max(10,Math.floor(count||common.length)));
  const start=Math.max(0,Math.min(Math.floor(startIndex||0),Math.max(0,common.length-size)));
  const startKey=periodKeyFor(common[start]),endKey=periodKeyFor(common[start+size-1]);
  for(const slot of slots){
    const rows=timelineRowsFor(slot);
    const a=rows.findIndex(row=>periodKeyFor(row)===startKey),b=rows.findIndex(row=>periodKeyFor(row)===endKey);
    slot.window=a>=0&&b>=a?timelineWindow(rows,a,b,10):timelineWindow([],0,0,10);
  }
}
