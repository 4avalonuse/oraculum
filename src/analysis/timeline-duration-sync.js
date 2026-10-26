import {matchWindowFrameCount} from './timeline-window-movement.js';

/* Synchronize frame counts while preserving each asset's chosen historical start. */
export function synchronizeWindowFrameCounts(slots,rowsForSlot){
 const primary=slots[0];
 if(!primary?.window?.valid)return;
 const frameCount=primary.window.observations;
 for(const slot of slots.slice(1)){
   slot.window=matchWindowFrameCount(rowsForSlot(slot),slot.window,frameCount);
 }
}
