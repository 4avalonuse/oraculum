/* ORACULUM — alinhamento temporal de séries.
 * Mantém os dados em buckets de calendário comuns e evita que séries com
 * calendários diferentes (cripto/ações) comparem retornos em horizontes distintos.
 */
export function periodKey(timestamp,interval='1d'){
  const d=new Date(Number(timestamp));
  if(!Number.isFinite(d.getTime())) return null;
  if(interval==='1h'){
    return String(Math.floor(Number(timestamp)/3600000));
  }
  if(interval==='1w'){
    const day=(d.getUTCDay()+6)%7;
    const monday=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-day));
    return monday.toISOString().slice(0,10);
  }
  if(interval==='1M'){
    return String(d.getUTCFullYear()).padStart(4,'0')+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
  }
  return d.toISOString().slice(0,10);
}

export function alignSeries(series,interval='1d'){
  if(!series?.length)return [];
  // Cross-market alignment is calendar-aware. BTC trades continuously, while
  // stocks/factors can be absent on weekends and exchange holidays. We align
  // observations by the requested period bucket rather than requiring identical
  // raw timestamps, then keep only periods observed by every series.
  const maps=series.map(s=>{
    const map=new Map();
    for(const candle of s.candles||[]){
      const key=periodKey(candle.timestamp,interval);
      const close=Number(candle.close);
      if(key&&Number.isFinite(close)&&close>0){const timestamp=Number(candle.timestamp),previous=map.get(key);if(!previous||timestamp>previous.timestamp)map.set(key,{timestamp,close});}
    }
    return map;
  });
  const previousCloseMaps=maps.map(map=>{const entries=[...map.entries()].sort((a,b)=>a[1].timestamp-b[1].timestamp),previous=new Map();for(let i=1;i<entries.length;i++)previous.set(entries[i][0],entries[i-1][1].close);return previous;});
  const base=series[0].candles||[];
  const seen=new Set();
  return base.map(c=>{
    const key=periodKey(c.timestamp,interval);
    if(!key||seen.has(key))return null;
    const hits=maps.map(map=>map.get(key));
    if(hits.some(hit=>!hit))return null;
    seen.add(key);
    const row={timestamp:hits[0].timestamp,__periodKey:key,__sourceTimestamps:{},__timestampOffsetsMs:{},__previousCloses:{},__sourceElapsedDays:{}};
    for(let i=0;i<series.length;i++){row[series[i].key]=hits[i].close;row.__sourceTimestamps[series[i].key]=hits[i].timestamp;row.__timestampOffsetsMs[series[i].key]=hits[i].timestamp-hits[0].timestamp;row.__previousCloses[series[i].key]=previousCloseMaps[i].get(key)??NaN;}
    return row;
  }).filter(Boolean).sort((a,b)=>a.timestamp-b.timestamp).map((row,i,all)=>{for(const s of series){const previous=all[i-1];row.__sourceElapsedDays[s.key]=previous?Math.max(0,(row.__sourceTimestamps[s.key]-previous.__sourceTimestamps[s.key])/86400000):null;}return {...row,__elapsedHours:i?Math.max(0,(row.timestamp-all[i-1].timestamp)/3600000):null,__elapsedDays:i?Math.max(0,(row.timestamp-all[i-1].timestamp)/86400000):null};});
}
