/* ORACULUM — núcleo estatístico.
 * Convenções: estatísticas amostrais; entradas não finitas são excluídas
 * por pares nas estatísticas bivariadas; resultados indefinidos retornam NaN.
 */
function finite(values){return Array.isArray(values)?values.filter(Number.isFinite):[]}
export function mean(values){const v=finite(values);return v.length?v.reduce((a,b)=>a+b,0)/v.length:NaN}
export function median(v){const x=finite(v).sort((a,b)=>a-b),m=Math.floor(x.length/2);return x.length?(x.length%2?x[m]:(x[m-1]+x[m])/2):NaN}
export function std(values){const v=finite(values);if(v.length<2)return NaN;const m=mean(v);return Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/(v.length-1))}
function paired(a,b){if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return [];const out=[];for(let i=0;i<a.length;i++)if(Number.isFinite(a[i])&&Number.isFinite(b[i]))out.push([a[i],b[i]]);return out}
export function cov(a,b){const p=paired(a,b);if(p.length<2)return NaN;const ma=mean(p.map(x=>x[0])),mb=mean(p.map(x=>x[1]));return p.reduce((s,[x,y])=>s+(x-ma)*(y-mb),0)/(p.length-1)}
export function corr(a,b){const p=paired(a,b);if(p.length<2)return NaN;const x=p.map(v=>v[0]),y=p.map(v=>v[1]),sx=std(x),sy=std(y);if(!(sx>0&&sy>0))return NaN;const value=cov(x,y)/(sx*sy);return Number.isFinite(value)?Math.max(-1,Math.min(1,value)):NaN}
export function returns(values,mode='log'){const out=[];if(!Array.isArray(values))return out;for(let i=1;i<values.length;i++){const a=Number(values[i-1]),b=Number(values[i]);if(Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>0)out.push(mode==='simple'?b/a-1:Math.log(b/a))}return out}
/* recovery = number of observations from the maximum-drawdown trough until a
 * subsequent new high. null means the series did not recover within the sample. */
export function drawdown(values){const v=finite(values).filter(x=>x>0);if(!v.length)return {max:NaN,recovery:null,peakIndex:null,troughIndex:null};let peak=v[0],peakIndex=0,max=0,troughIndex=0,recovery=0,underwater=false;for(let i=0;i<v.length;i++){const value=v[i];if(value>=peak){if(underwater){recovery=i-troughIndex;underwater=false}peak=value;peakIndex=i}else{const dd=value/peak-1;if(dd<max){max=dd;troughIndex=i;underwater=true;recovery=null}}}return {max,recovery:underwater?null:recovery,peakIndex,troughIndex}}
export function regression(x,y){const p=paired(x,y);if(p.length<2)return {alpha:NaN,beta:NaN,r:NaN,r2:NaN,n:p.length};const a=p.map(v=>v[0]),b=p.map(v=>v[1]),variance=cov(a,a);if(!(variance>0))return {alpha:NaN,beta:NaN,r:corr(a,b),r2:NaN,n:p.length};const beta=cov(a,b)/variance,alpha=mean(b)-beta*mean(a),r=corr(a,b);return {alpha,beta,r,r2:Number.isFinite(r)?r*r:NaN,n:p.length}}
export function annualPeriods(interval,calendar='continuous'){if(interval==='1w')return 52;if(interval==='1M')return 12;if(calendar==='trading')return interval==='1h'?1638:interval==='1d'?252:365;return interval==='1h'?8760:365}
export function cagr(first,last,years){return first>0&&last>0&&years>0?(last/first)**(1/years)-1:NaN}
export function sharpe(r,p){const s=std(r);return s>0&&p>0?mean(r)/s*Math.sqrt(p):NaN}
export function sortino(r,p){const x=finite(r),downside=x.filter(v=>v<0),s=std(downside);return s>0&&p>0?mean(x)/s*Math.sqrt(p):NaN}
export function quantile(v,q){const x=finite(v).sort((a,b)=>a-b);if(!x.length||!Number.isFinite(q)||q<0||q>1)return NaN;const i=(x.length-1)*q,f=Math.floor(i),c=Math.ceil(i);return x[f]+(x[c]-x[f])*(i-f)}
export function leadLag(a,b,maxLag=5){const out=[];if(!Number.isInteger(maxLag)||maxLag<0)return out;for(let lag=-maxLag;lag<=maxLag;lag++){const x=[],y=[];for(let i=0;i<a.length;i++){const j=i+lag;if(j>=0&&j<b.length){x.push(a[i]);y.push(b[j])}}out.push({lag,corr:corr(x,y)})}return out}
function periodKey(timestamp,interval='1d'){
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
      if(key&&Number.isFinite(close)&&close>0) map.set(key,{timestamp:Number(candle.timestamp),close});
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
    const row={timestamp:hits[0].timestamp,__previousCloses:{}};
    for(let i=0;i<series.length;i++){row[series[i].key]=hits[i].close;row.__previousCloses[series[i].key]=previousCloseMaps[i].get(key)??NaN;}
    return row;
  }).filter(Boolean).sort((a,b)=>a.timestamp-b.timestamp);
}
import {describe,jarqueBera} from './descriptive.js';
import {riskMetrics,calmar} from './risk.js';

export function analyzeSeries(rows,series,interval,options={}){
  const periods=annualPeriods(interval,options.calendar||'continuous'),mode=options.returnMode==='simple'?'simple':'log',rollingWindow=Math.max(5,Number(options.rollingWindow)||30),years=Math.max(1/periods,(rows.at(-1).timestamp-rows[0].timestamp)/(365.25*86400000)),out={interval,periods,years,observations:rows.length,returnMode:mode,rollingWindow,series:{},relations:[]};
  for(const s of series){
    const values=rows.map(r=>r[s.key]),r=rows.some(row=>row.__previousCloses)?rows.map((row,i)=>{if(i===0)return NaN;const previous=row.__previousCloses?.[s.key],current=values[i];if(!(previous>0&&current>0&&Number.isFinite(previous)&&Number.isFinite(current)))return NaN;return mode==='simple'?current/previous-1:Math.log(current/previous)}):returns(values,mode),validReturns=r.filter(Number.isFinite),dd=drawdown(values),dist={win:validReturns.filter(x=>x>0).length/Math.max(1,validReturns.length),best:validReturns.length?Math.max(...validReturns):NaN,worst:validReturns.length?Math.min(...validReturns):NaN,q25:quantile(validReturns,.25),q75:quantile(validReturns,.75)},d=describe(r),risk=riskMetrics(r,periods,options);
    out.series[s.key]={key:s.key,symbol:s.symbol,name:s.name,start:values[0],end:values.at(-1),total:values.at(-1)/values[0]-1,cagr:cagr(values[0],values.at(-1),years),vol:std(r)*Math.sqrt(periods),drawdown:dd.max,recovery:dd.recovery,sharpe:sharpe(r,periods),sortino:risk.sortino,downsideDeviation:risk.downsideDeviation,sharpe:risk.sharpe,var95:risk.var95,var99:risk.var99,es95:risk.es95,es99:risk.es99,calmar:calmar(cagr(values[0],values.at(-1),years),dd.max),mean:d.mean,median:d.median,variance:d.variance,std:d.std,se:d.se,q05:d.q05,q95:d.q95,skewness:d.skewness,excessKurtosis:d.excessKurtosis,jarqueBera:jarqueBera(r),winRate:dist.win,best:dist.best,worst:dist.worst,ath:Math.max(...values),atl:Math.min(...values),returns:r};
  }
  const primary=series[0],pr=out.series[primary.key].returns;
  for(const s of series.slice(1)){const sr=out.series[s.key].returns,a=pr,b=sr,reg=regression(a,b),lags=leadLag(a,b,5);out.relations.push({primary:primary.key,target:s.key,correlation:corr(a,b),covariance:cov(a,b),beta:reg.beta,alpha:reg.alpha,r2:reg.r2,leadLag:lags.slice().sort((x,y)=>Math.abs(y.corr)-Math.abs(x.corr))[0],rolling:rollingCorrelation(a,b,Math.min(rollingWindow,a.length))})}
  return out
}
export function rollingCorrelation(a,b,window=30){if(a.length<window)return NaN;const values=[];for(let i=window;i<=a.length;i++)values.push(corr(a.slice(i-window,i),b.slice(i-window,i)));return values.at(-1)}

export function deflateValues(values,cpi){
  if(!Array.isArray(values)||!Array.isArray(cpi)) return [];
  const map=new Map(cpi.map(x=>[Number(x.timestamp),Number(x.value)]).filter(x=>Number.isFinite(x[0])&&Number.isFinite(x[1])&&x[1]>0));
  const base=[...map.values()].at(-1);
  return values.map(x=>({timestamp:Number(x.timestamp),nominal:Number(x.value),real:map.has(Number(x.timestamp))?Number(x.value)*base/map.get(Number(x.timestamp)):null}));
}

export function realReturn(first,last,cpiFirst,cpiLast){
  if(!(first>0&&last>0&&cpiFirst>0&&cpiLast>0)) return NaN;
  return (last/cpiLast)/(first/cpiFirst)-1;
}
