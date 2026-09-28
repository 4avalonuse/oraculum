function validTimestamp(value){return Number.isFinite(Number(value));}

export function createObservation({variableId,timestamp,value,revision=null,source=null}={}){
  if(!variableId) throw new Error('Observation requer variableId');
  if(!validTimestamp(timestamp)) throw new Error('Observation requer timestamp válido');
  if(!Number.isFinite(Number(value))) throw new Error('Observation requer value numérico');
  return Object.freeze({variableId,timestamp:Number(timestamp),value:Number(value),revision:revision??null,source:source??null});
}