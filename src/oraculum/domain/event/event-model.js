function cleanString(value){return typeof value==='string'&&value.trim()?value.trim():null;}

export function createEvent({id,timestamp,category=null,type=null,country=null,title,description=null,source=null,importance=null,assetIds=[]}={}){
  if(!cleanString(id)) throw new Error('Event requer id');
  if(!Number.isFinite(Number(timestamp))) throw new Error('Event requer timestamp válido');
  if(!cleanString(title)) throw new Error('Event requer title');
  const ids=Array.isArray(assetIds)?[...new Set(assetIds.filter(Boolean))]:[];
  return Object.freeze({id:cleanString(id),timestamp:Number(timestamp),category:cleanString(category),type:cleanString(type),country:cleanString(country),title:cleanString(title),description:cleanString(description),source:cleanString(source),importance:importance??null,assetIds:ids});
}