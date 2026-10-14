/* ORACULUM — estudo de evento para BTC.
 * Usa candles observados; não interpola preços nem preenche janelas ausentes.
 * A janela pré-evento é -4h → -1h. Janelas posteriores são medidas
 * contra o preço observado em -1h. Não implica causalidade.
 */
const HOUR=60*60*1000;
function closeOf(row){return Number(row?.close??row?.c)}
function timeOf(row){return Number(row?.timestamp??row?.t??row?.ts)}
function validRows(candles){
  return (Array.isArray(candles)?candles:[])
    .map(row=>({timestamp:timeOf(row),close:closeOf(row)}))
    .filter(row=>Number.isFinite(row.timestamp)&&Number.isFinite(row.close)&&row.close>0)
    .sort((a,b)=>a.timestamp-b.timestamp)
    .filter((row,i,all)=>i===0||row.timestamp>all[i-1].timestamp);
}
function nearest(rows,target,toleranceMs){
  let best=null,distance=Infinity;
  for(const row of rows){
    const delta=Math.abs(row.timestamp-target);
    if(delta<distance){best=row;distance=delta}
  }
  return best&&distance<=toleranceMs?{...best,offsetMinutes:Math.round((best.timestamp-target)/60000)}:null;
}
function nearestBefore(rows,target,toleranceMs){
  let best=null;
  for(const row of rows)if(row.timestamp<target)best=row;
  if(!best||target-best.timestamp>toleranceMs)return null;
  return {...best,offsetMinutes:Math.round((best.timestamp-target)/60000)};
}
function pct(a,b){return a>0&&b>0?(b/a-1)*100:null}
export function analyzeBtcEventWindow(candles,eventTimestamp,options={}){
  const rows=validRows(candles),toleranceMs=Number(options.toleranceMs)||90*60*1000;
  if(!Number.isFinite(Number(eventTimestamp)))return {available:false,reason:'Horário do evento inválido.',observations:rows.length};
  if(rows.length<2)return {available:false,reason:'A série horária ainda não tem observações suficientes.',observations:rows.length};
  const event=Number(eventTimestamp);
  const pre4=nearest(rows,event-4*HOUR,toleranceMs);
  const anchor=nearest(rows,event-HOUR,toleranceMs);
  const post1=nearest(rows,event+HOUR,toleranceMs);
  const post4=nearest(rows,event+4*HOUR,toleranceMs);
  const post24=nearest(rows,event+24*HOUR,toleranceMs);
  if(!anchor)return {available:false,reason:'Não há candle confiável próximo de T−1h para definir a referência pré-evento.',observations:rows.length,coverage:{start:rows[0].timestamp,end:rows.at(-1).timestamp}};
  const measure=(row)=>row?{timestamp:row.timestamp,price:row.close,offsetMinutes:row.offsetMinutes,returnPct:pct(anchor.close,row.close)}:{timestamp:null,price:null,offsetMinutes:null,returnPct:null};
  const last=rows.at(-1);
  return {
    available:true,eventTimestamp:event,observations:rows.length,
    coverage:{start:rows[0].timestamp,end:last.timestamp},
    baseline:{...anchor,returnPct:0},
    pre:{start:measure(pre4),end:measure(anchor),returnPct:pre4?pct(pre4.close,anchor.close):null},
    post:{h1:measure(post1),h4:measure(post4),h24:measure(post24)},
    toleranceMinutes:Math.round(toleranceMs/60000),
    notes:[
      'Referência = candle observado mais próximo de T−1h, dentro da tolerância informada.',
      'O retorno pré-evento é T−1h contra T−4h; os retornos pós-evento usam T−1h como base.',
      'Janelas ausentes são exibidas como indisponíveis; nenhum preço é interpolado.',
      'Uma reação temporal é associação, não prova de causalidade. Eventos simultâneos podem explicar parte do movimento.'
    ]
  };
}
export function formatEventStudyPct(value){
  if(!Number.isFinite(value))return 'INDISPONÍVEL';
  const sign=value>0?'+':'';
  return sign+value.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
}
