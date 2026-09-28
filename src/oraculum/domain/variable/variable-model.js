function cleanString(value){return typeof value==='string'&&value.trim()?value.trim():null;}

export function createVariable({id,name,category=null,subcategory=null,symbol=null,source=null,unit=null,frequency=null,description=null}={}){
  const safeId=cleanString(id), safeName=cleanString(name);
  if(!safeId) throw new Error('Variable requer id');
  if(!safeName) throw new Error('Variable requer name');
  return Object.freeze({id:safeId,name:safeName,category:cleanString(category),subcategory:cleanString(subcategory),symbol:cleanString(symbol),source:cleanString(source),unit:cleanString(unit),frequency:cleanString(frequency),description:cleanString(description)});
}