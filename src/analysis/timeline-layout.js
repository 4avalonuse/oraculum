/* Pure visual layout: fixed frame scale, optional horizontal viewport, unchanged source samples. */
export function timelineLayout(slots,rowsForSlot,alignment,viewportStart=0){
 const durations=slots.map(slot=>rowsForSlot(slot).length);
 const capacity=Math.max(1,...durations);
 const start=alignment==='sequential'?Math.max(0,Math.floor(viewportStart)):0;
 let offset=0;
 return slots.map((slot,index)=>{
   const source=rowsForSlot(slot);
   const globalPosition=alignment==='sequential'?offset:0;
   if(alignment==='sequential')offset+=durations[index];
   const clipStart=Math.min(source.length,Math.max(0,start-globalPosition));
   const visibleCount=Math.max(0,Math.min(source.length-clipStart,capacity-Math.max(0,globalPosition-start)));
   const position=Math.max(0,globalPosition-start);
   return {position,duration:source.length,capacity,visibleCount,
     hiddenCount:source.length-visibleCount,rows:source.slice(clipStart,clipStart+visibleCount),
     incomplete:visibleCount<source.length};
 });
}
