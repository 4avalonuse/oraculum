const TYPES=new Set(['chart','event','variable','analysis','text','composite']);

export function createFrame({
  id,
  type='composite',
  title=null,
  start=null,
  end=null,
  content=null,
  sourceIds=[],
  position={x:0,y:0},
  metadata={},
}={}){
  if(!id) throw new TypeError('Frame requires id');
  if(!TYPES.has(type)) throw new TypeError(`Unsupported frame type: ${type}`);
  if(start!==null&&!Number.isFinite(Number(start))) throw new TypeError('Frame start must be finite');
  if(end!==null&&!Number.isFinite(Number(end))) throw new TypeError('Frame end must be finite');
  if(start!==null&&end!==null&&Number(start)>Number(end)) throw new RangeError('Frame start must be <= end');

  return Object.freeze({
    id,
    type,
    title,
    start:start===null?null:Number(start),
    end:end===null?null:Number(end),
    content,
    sourceIds:[...new Set(sourceIds)],
    position:{x:Number(position?.x??0),y:Number(position?.y??0)},
    metadata:{...metadata},
  });
}
