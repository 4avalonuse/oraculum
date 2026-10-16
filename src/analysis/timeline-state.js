/* ORACULUM — estado temporal puro das timelines de investigação.
 * Não calcula estatísticas nem alinha retornos: só resolve janelas e limites.
 * Os consumidores devem explicitar se uma análise usa datas comuns ou tempo relativo.
 */
const timeOf = value => Number(value?.timestamp);
const validCandles = candles => (Array.isArray(candles) ? candles : [])
  .filter(c => Number.isFinite(timeOf(c)))
  .slice()
  .sort((a,b) => timeOf(a)-timeOf(b));

export function nearestTimelineIndex(candles, timestamp) {
  const rows = validCandles(candles);
  if (!rows.length || !Number.isFinite(Number(timestamp))) return -1;
  let lo=0, hi=rows.length-1;
  while(lo<hi) {
    const mid=Math.floor((lo+hi)/2);
    if(timeOf(rows[mid])<Number(timestamp)) lo=mid+1;
    else hi=mid;
  }
  if(lo>0 && Math.abs(timeOf(rows[lo-1])-timestamp)<=Math.abs(timeOf(rows[lo])-timestamp)) return lo-1;
  return lo;
}

export function timelineWindow(candles, startIndex, endIndex, minObservations=2) {
  const rows=validCandles(candles);
  if(!rows.length) return {valid:false,reason:'NO_DATA',startIndex:-1,endIndex:-1,start:null,end:null,durationMs:0,observations:0};
  const minCount=Math.max(2,Math.floor(Number(minObservations)||2));
  const max=rows.length-1;
  let start=Math.max(0,Math.min(max,Math.floor(Number(startIndex)||0)));
  let end=Math.max(0,Math.min(max,Math.floor(Number(endIndex)||0)));
  if(end<start) [start,end]=[end,start];
  if(end-start+1<minCount) {
    end=Math.min(max,start+minCount-1);
    if(end-start+1<minCount) start=Math.max(0,end-minCount+1);
  }
  const first=timeOf(rows[start]),last=timeOf(rows[end]);
  return {valid:end-start+1>=minCount,reason:end-start+1>=minCount?null:'INSUFFICIENT_DATA',startIndex:start,endIndex:end,start:first,end:last,durationMs:last-first,observations:end-start+1};
}

export function shiftTimelineWindow(candles, window, deltaMs, minObservations=2) {
  const rows=validCandles(candles);
  if(!rows.length || !window?.valid) return timelineWindow(rows,0,rows.length-1,minObservations);
  const duration=Math.max(0,Number(window.durationMs)||0);
  const first=timeOf(rows[0]),last=timeOf(rows.at(-1));
  let targetStart=Math.max(first,Math.min(last-duration,Number(window.start)+Number(deltaMs)));
  if(!Number.isFinite(targetStart)) targetStart=first;
  let start=nearestTimelineIndex(rows,targetStart);
  let end=nearestTimelineIndex(rows,targetStart+duration);
  const minCount=Math.max(2,Math.floor(Number(minObservations)||2));
  if(end-start+1<minCount) {
    end=Math.min(rows.length-1,start+minCount-1);
    if(end-start+1<minCount) start=Math.max(0,end-minCount+1);
  }
  return timelineWindow(rows,start,end,minCount);
}

export function resizeTimelineWindow(candles, window, edge, deltaMs, minObservations=2) {
  const rows=validCandles(candles);
  if(!rows.length || !window?.valid || !['start','end'].includes(edge)) return timelineWindow(rows,0,rows.length-1,minObservations);
  const target=edge==='start'?window.start+Number(deltaMs):window.end+Number(deltaMs);
  const index=nearestTimelineIndex(rows,Math.max(timeOf(rows[0]),Math.min(timeOf(rows.at(-1)),target)));
  return edge==='start'
    ? timelineWindow(rows,Math.min(index,window.endIndex-minObservations+1),window.endIndex,minObservations)
    : timelineWindow(rows,window.startIndex,Math.max(index,window.startIndex+minObservations-1),minObservations);
}

export function timelineWindowLabel(window, formatDate) {
  if(!window?.valid) return 'Período indisponível';
  return formatDate(window.start)+' → '+formatDate(window.end);
}
export function resizeTimelineDuration(candles, window, durationMs, minObservations=2) {
  const rows=validCandles(candles);
  if(!rows.length || !window?.valid) return timelineWindow(rows,0,rows.length-1,minObservations);
  const duration=Math.max(0,Number(durationMs)||0);
  const first=timeOf(rows[0]),last=timeOf(rows.at(-1));
  const startTime=Math.max(first,Math.min(last-duration,Number(window.start)));
  const start=nearestTimelineIndex(rows,startTime);
  let end=nearestTimelineIndex(rows,Math.min(last,startTime+duration));
  const minCount=Math.max(2,Math.floor(Number(minObservations)||2));
  if(end-start+1<minCount) {
    end=Math.min(rows.length-1,start+minCount-1);
    if(end-start+1<minCount) return timelineWindow(rows,0,rows.length-1,minCount);
  }
  return timelineWindow(rows,start,end,minCount);
}

/** Return one primary timeline plus every distinct selected comparison series. */
export function timelineAssetKeys(reference, selectedKeys=[]) {
  const unique=[...new Set(selectedKeys.filter(key=>key&&key!==reference))];
  return [reference,...unique];
}
