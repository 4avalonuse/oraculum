/* Automatic alignment uses the same historical frame coordinates as manual dragging.
 * Never resize a window or fabricate observations. */
import {moveWindowByFrames} from './timeline-window-movement.js';

export function alignTimelineWindows(slots,rowsForSlot,kind){
 if(!Array.isArray(slots)||!slots.length||!['start','sequential'].includes(kind))return;
 const first=slots[0];
 if(!first?.window?.valid)return;
 let nextStart=first.window.startIndex;
 for(let i=1;i<slots.length;i++){
  const slot=slots[i],window=slot.window,rows=rowsForSlot(slot);
  if(!window?.valid||!rows?.length)continue;
  const count=window.endIndex-window.startIndex+1;
  const target=kind==='start'?first.window.startIndex:nextStart;
  const fits=target>=0&&target+count<=rows.length;
  if(fits){
   slot.window=moveWindowByFrames(rows,window,target-window.startIndex);
   if(kind==='start'){
    // Restore all participants when returning to the common starting point.
    slot.active=true;
    slot.autoAlignmentInactive=false;
   }else if(slot.autoAlignmentInactive){
    slot.active=true;
    slot.autoAlignmentInactive=false;
   }
  }else if(kind==='sequential'){
   // Keep the last valid window visible as a ghost reference.
   if(slot.active!==false){slot.active=false;slot.autoAlignmentInactive=true;}
  }else{
   // A manually inactive slot remains a ghost unless the user reactivates it.
   if(slot.autoAlignmentInactive){slot.active=true;slot.autoAlignmentInactive=false;}
  }
  if(kind==='sequential')nextStart=target+count;
 }
}
