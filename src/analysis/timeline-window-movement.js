/* Move a window only in its own asset's observations. */
import {timelineWindow} from './timeline-state.js';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export function moveWindowByFrames(rows,window,delta,minCount=10){
 if(!window?.valid||!rows?.length)return window;
 const count=window.endIndex-window.startIndex+1;
 const start=clamp(window.startIndex+Math.round(delta),0,Math.max(0,rows.length-count));
 return timelineWindow(rows,start,start+count-1,Math.min(minCount,count));
}
export function resizeWindowByFrames(rows,window,edge,delta,minCount=10){
 if(!window?.valid||!rows?.length)return window;
 const start=edge==='start'?clamp(window.startIndex+Math.round(delta),0,window.endIndex-minCount+1):window.startIndex;
 const end=edge==='end'?clamp(window.endIndex+Math.round(delta),start+minCount-1,rows.length-1):window.endIndex;
 return timelineWindow(rows,start,end,minCount);
}

/* Match the primary frame count without replacing this asset's selected era. */
export function matchWindowFrameCount(rows,window,count,minCount=10){
 if(!window?.valid||!rows?.length)return window;
 const n=Math.min(rows.length,Math.max(Math.min(minCount,rows.length),Math.floor(Number(count)||0)));
 const start=clamp(window.startIndex,0,rows.length-n);
 return timelineWindow(rows,start,start+n-1,Math.min(minCount,n));
}
