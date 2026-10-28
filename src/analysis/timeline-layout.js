/* Pure visual layout: selection coordinates use the asset's full historical track.
 * Chart samples remain restricted to each selected window. */
export function timelineLayout(slots,rowsForSlot,alignment,viewportStart=0){
 const lengths=slots.map(slot=>rowsForSlot(slot).length);
 const capacity=alignment==='sequential'?Math.max(1,lengths.reduce((total,length)=>total+length,0)):Math.max(1,...lengths);
 const start=0; // Sequential view spans all historical tracks without clipping later assets.
 let offset=0;
 return slots.map((slot,index)=>{
   const source=rowsForSlot(slot);
   const globalPosition=alignment==='sequential'?offset:0;
   if(alignment==='sequential')offset+=source.length;
   const from=Math.max(0,Number(slot.window?.startIndex)||0);
   const to=Math.min(source.length,Number(slot.window?.endIndex)+1||0);
   const selected=slot.window?.valid?source.slice(from,to):[];
   const selectionStart=globalPosition+from;
   const clipStart=Math.max(0,start-selectionStart);
   const position=Math.max(0,selectionStart-start);
   const visibleCount=Math.max(0,Math.min(selected.length-clipStart,capacity-position));
   return {position,duration:selected.length,capacity,visibleCount,
     hiddenCount:selected.length-visibleCount,rows:selected.slice(clipStart,clipStart+visibleCount),
     incomplete:visibleCount<selected.length};
 });
}
