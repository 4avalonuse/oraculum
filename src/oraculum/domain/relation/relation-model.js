function cleanString(value){return typeof value==='string'&&value.trim()?value.trim():null;}

export function createRelation({id,source,target,type,method=null,lag=null,window=null,period=null,result=null,limitations=null}={}){
  if(!cleanString(id)) throw new Error('Relation requer id');
  if(!source) throw new Error('Relation requer source');
  if(!target) throw new Error('Relation requer target');
  if(!cleanString(type)) throw new Error('Relation requer type');
  return Object.freeze({id:cleanString(id),source,target,type:cleanString(type),method:cleanString(method),lag,window,period,result,limitations:cleanString(limitations)});
}