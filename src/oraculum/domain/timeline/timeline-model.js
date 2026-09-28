function assertTimestamp(value,name='timestamp'){
  if(!Number.isFinite(Number(value))) throw new TypeError(`${name} must be a finite number`);
}

export function createTimeline({id,title=null,assetIds=[],items=[],start=null,end=null,metadata={}}={}){
  if(!id) throw new TypeError('Timeline requires id');
  if(start!==null) assertTimestamp(start,'start');
  if(end!==null) assertTimestamp(end,'end');
  if(start!==null&&end!==null&&Number(start)>Number(end)) throw new RangeError('Timeline start must be <= end');

  const normalizedItems=[...items].map((item)=>({
    ...item,
    timestamp:Number(item.timestamp),
  }));

  if(normalizedItems.some((item)=>!Number.isFinite(item.timestamp))){
    throw new TypeError('Timeline items require finite timestamp');
  }

  return Object.freeze({
    id,
    title,
    assetIds:[...new Set(assetIds)],
    items:normalizedItems,
    start:start===null?null:Number(start),
    end:end===null?null:Number(end),
    metadata:{...metadata},
  });
}
