function cleanString(value){return typeof value==='string'&&value.trim()?value.trim():null;}

export function createAsset({id,symbol,name,type='market',currency=null,country=null,metadata={}}={}){
  const safeSymbol=cleanString(symbol);
  if(!safeSymbol) throw new Error('Asset requer symbol');
  return Object.freeze({id:cleanString(id)||safeSymbol.toLowerCase(),symbol:safeSymbol,name:cleanString(name)||safeSymbol,type:cleanString(type)||'market',currency:cleanString(currency),country:cleanString(country),metadata:metadata&&typeof metadata==='object'&&!Array.isArray(metadata)?{...metadata}: {}});
}