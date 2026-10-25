/* Estado de participação das timelines: visibilidade não equivale a inclusão na análise. */
export function activeTimelineSlots(slots){
  return (Array.isArray(slots)?slots:[]).filter(slot=>slot?.active!==false);
}
export function toggleTimelineActive(slots,index){
  if(!Array.isArray(slots)||!Number.isInteger(index)||index<0||index>=slots.length)return slots;
  // A janela principal é a referência da investigação e permanece ativa nesta primeira etapa.
  if(index===0)return slots;
  return slots.map((slot,i)=>i===index?{...slot,active:slot.active===false}:slot);
}
export function activeTimelineCount(slots){return activeTimelineSlots(slots).length;}
