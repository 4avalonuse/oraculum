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
/* Returns are computed between consecutive shared analysis rows. This keeps cross-asset returns on the same observation horizon (e.g. Friday-to-Monday for both BTC and equities), rather than comparing a multi-day equity return with a one-day BTC return. Invalid pairs remain NaN so array positions never drift. */
export function alignedReturns(rows,key,mode='log'){if(!Array.isArray(rows))return [];return rows.map((row,i)=>{if(i===0)return NaN;const previous=Number(rows[i-1]?.[key]),current=Number(row?.[key]);if(!(previous>0&&current>0&&Number.isFinite(previous)&&Number.isFinite(current)))return NaN;return mode==='simple'?current/previous-1:Math.log(current/previous)})}
/* recovery = observations from the deepest drawdown trough until price
 * regains that drawdown's prior peak. Indices refer to the original input. */
export function drawdown(values){
  if(!Array.isArray(values)) return {max:NaN,recovery:null,peakIndex:null,troughIndex:null};
  const valid=values.map((value,index)=>({value,index})).filter(x=>Number.isFinite(x.value)&&x.value>0);
  if(!valid.length) return {max:NaN,recovery:null,peakIndex:null,troughIndex:null};
  let peak=valid[0].value,peakIndex=valid[0].index,max=0,maxPeakIndex=peakIndex,troughIndex=peakIndex,recovery=0;
  for(let i=1;i<valid.length;i++){
    const {value,index}=valid[i];
    if(value>=peak){peak=value;peakIndex=index}
    const dd=value/peak-1;
    if(dd<max){max=dd;maxPeakIndex=peakIndex;troughIndex=index;recovery=null}
  }
  if(max<0){
    const troughPos=valid.findIndex(x=>x.index===troughIndex);
    const peakValue=values[maxPeakIndex];
    const recovered=valid.slice(troughPos+1).find(x=>x.value>=peakValue);
    recovery=recovered?recovered.index-troughIndex:null;
  }
  return {max,recovery,peakIndex:maxPeakIndex,troughIndex};
}
export function regression(x,y){const p=paired(x,y);if(p.length<2)return {alpha:NaN,beta:NaN,r:NaN,r2:NaN,n:p.length};const a=p.map(v=>v[0]),b=p.map(v=>v[1]),variance=cov(a,a);if(!(variance>0))return {alpha:NaN,beta:NaN,r:corr(a,b),r2:NaN,n:p.length};const beta=cov(a,b)/variance,alpha=mean(b)-beta*mean(a),r=corr(a,b);return {alpha,beta,r,r2:Number.isFinite(r)?r*r:NaN,n:p.length}}
export function annualPeriods(interval,calendar='continuous'){if(interval==='1w')return 52;if(interval==='1M')return 12;if(calendar==='trading')return interval==='1h'?1638:interval==='1d'?252:365;return interval==='1h'?8760:365}
export function cagr(first,last,years){return first>0&&last>0&&years>0?(last/first)**(1/years)-1:NaN}
export function sharpe(r,p){const s=std(r);return s>0&&p>0?mean(r)/s*Math.sqrt(p):NaN}
export function sortino(r,p){const x=finite(r),s=downsideDeviation(x,0);return s>0&&p>0?mean(x)/s*Math.sqrt(p):NaN}
export function quantile(v,q){const x=finite(v).sort((a,b)=>a-b);if(!x.length||!Number.isFinite(q)||q<0||q>1)return NaN;const i=(x.length-1)*q,f=Math.floor(i),c=Math.ceil(i);return x[f]+(x[c]-x[f])*(i-f)}
export function leadLag(a,b,maxLag=5){const out=[];if(!Number.isInteger(maxLag)||maxLag<0)return out;for(let lag=-maxLag;lag<=maxLag;lag++){const x=[],y=[];for(let i=0;i<a.length;i++){const j=i+lag;if(j>=0&&j<b.length){x.push(a[i]);y.push(b[j])}}out.push({lag,corr:corr(x,y)})}return out}
import {alignSeries,periodKey} from './data/alignment.js';
export {alignSeries} from './data/alignment.js';

import {describe,jarqueBera} from './descriptive.js';
import {riskMetrics,calmar,downsideDeviation} from './risk.js';
import {auditAnalysis} from './provenance.js';

function temporalRelationSummary(rows,primaryKey,targetKey){
  const offsets=rows.map(row=>Number(row.__timestampOffsetsMs?.[targetKey])-Number(row.__timestampOffsetsMs?.[primaryKey])).filter(Number.isFinite).map(v=>Math.abs(v)/3600000);
  const xGaps=rows.map(row=>Number(row.__sourceElapsedDays?.[primaryKey])).filter(v=>Number.isFinite(v)&&v>0);
  const yGaps=rows.map(row=>Number(row.__sourceElapsedDays?.[targetKey])).filter(v=>Number.isFinite(v)&&v>0);
  const medianValue=values=>{const v=values.slice().sort((a,b)=>a-b);return v.length?v[Math.floor((v.length-1)/2)]:NaN};
  return {timestampOffsetMedianHours:medianValue(offsets),timestampOffsetMaxHours:offsets.length?Math.max(...offsets):NaN,primaryElapsedDaysMedian:medianValue(xGaps),targetElapsedDaysMedian:medianValue(yGaps),timestampOffsetObservations:offsets.length,hasTimestampMetadata:offsets.length>0};
}
function bucketOrdinal(key,interval){
  if(!key)return NaN;
  if(interval==='1h')return Number(key);
  if(interval==='1M')return Date.parse(key+'-01T00:00:00Z');
  return Date.parse(key+'T00:00:00Z');
}
function nativeBucketRows(s,interval,firstKey,lastKey,fallbackRows){
  if(!Array.isArray(s.candles)||!s.candles.length)return fallbackRows.map(row=>({timestamp:row.timestamp,[s.key]:row[s.key]}));
  const lo=bucketOrdinal(firstKey,interval),hi=bucketOrdinal(lastKey,interval),byKey=new Map();
  for(const candle of s.candles){
    const timestamp=Number(candle.timestamp),key=periodKey(timestamp,interval),order=bucketOrdinal(key,interval);
    if(!key||!Number.isFinite(timestamp)||order<lo||order>hi)continue;
    const previous=byKey.get(key);
    if(!previous||timestamp>previous.timestamp)byKey.set(key,{timestamp,[s.key]:Number(candle.close),__periodKey:key});
  }
  return [...byKey.values()].sort((a,b)=>a.timestamp-b.timestamp);
}
export function analyzeSeries(rows,series,interval,options={}){
  const mode=options.returnMode==='simple'?'simple':'log',rollingWindow=Math.max(5,Number(options.rollingWindow)||30);
  const firstKey=rows[0]?.__periodKey||periodKey(rows[0]?.timestamp,interval),lastKey=rows.at(-1)?.__periodKey||periodKey(rows.at(-1)?.timestamp,interval);
  const sharedYears=Math.max(1/365.25,(rows.at(-1).timestamp-rows[0].timestamp)/(365.25*86400000));
  const out={interval,periods:null,years:sharedYears,observations:rows.length,alignedObservations:rows.length,returnMode:mode,rollingWindow,rowsStart:rows[0]?.timestamp??null,rowsEnd:rows.at(-1)?.timestamp??null,series:{},relations:[],temporal:{method:'native-series statistics; cross-asset relations on shared calendar buckets',sharedRows:rows.length,firstBucket:firstKey,lastBucket:lastKey,elapsedDays:(rows.at(-1).timestamp-rows[0].timestamp)/86400000,gaps:rows.slice(1).map((row,i)=>({from:rows[i].timestamp,to:row.timestamp,days:(row.timestamp-rows[i].timestamp)/86400000})).filter(g=>g.days>1.5).length}};
  for(const s of series){
    const nativeRows=nativeBucketRows(s,interval,firstKey,lastKey,rows),rawValues=nativeRows.map(r=>Number(r[s.key])),validPrices=rawValues.filter(v=>Number.isFinite(v)&&v>0);
    const values=rawValues,r=alignedReturns(nativeRows,s.key,mode),validReturns=r.filter(Number.isFinite);
    const category=s.category,calendar=category?(['crypto','test'].includes(category)?'continuous':'trading'):(options.calendar||'continuous');
    const periods=annualPeriods(interval,calendar),firstPrice=values.find(v=>Number.isFinite(v)&&v>0),lastPrice=[...values].reverse().find(v=>Number.isFinite(v)&&v>0);
    const firstRow=nativeRows.find(row=>Number.isFinite(row[s.key])&&row[s.key]>0),lastRow=[...nativeRows].reverse().find(row=>Number.isFinite(row[s.key])&&row[s.key]>0);
    const years=firstRow&&lastRow?Math.max(1/periods,(lastRow.timestamp-firstRow.timestamp)/(365.25*86400000)):NaN;
    const dd=drawdown(values),dist={win:validReturns.filter(x=>x>0).length/Math.max(1,validReturns.length),best:validReturns.length?Math.max(...validReturns):NaN,worst:validReturns.length?Math.min(...validReturns):NaN,q25:quantile(validReturns,.25),q75:quantile(validReturns,.75)},d=describe(r),risk=riskMetrics(r,periods,options);
    out.series[s.key]={key:s.key,symbol:s.symbol,name:s.name,start:firstPrice,end:lastPrice,cagr:cagr(firstPrice,lastPrice,years),total:firstPrice>0&&lastPrice>0?lastPrice/firstPrice-1:NaN,vol:std(r)*Math.sqrt(periods),drawdown:dd.max,recovery:dd.recovery,sortino:risk.sortino,downsideDeviation:risk.downsideDeviation,sharpe:risk.sharpe,var95:risk.var95,var99:risk.var99,es95:risk.es95,es99:risk.es99,calmar:calmar(cagr(firstPrice,lastPrice,years),dd.max),mean:d.mean,median:d.median,variance:d.variance,std:d.std,se:d.se,q05:d.q05,q95:d.q95,skewness:d.skewness,excessKurtosis:d.excessKurtosis,jarqueBera:jarqueBera(r),winRate:dist.win,best:dist.best,worst:dist.worst,ath:validPrices.length?Math.max(...validPrices):NaN,atl:validPrices.length?Math.min(...validPrices):NaN,returns:r,alignedReturns:alignedReturns(rows,s.key,mode),nativeObservations:nativeRows.length,validReturns:validReturns.length,annualizationPeriods:periods,annualizationCalendar:calendar,years,rowsStart:firstRow?.timestamp??null,rowsEnd:lastRow?.timestamp??null,returnHorizon:'native consecutive observed buckets'};
  }
  const primary=series[0];
  const primaryReturns=alignedReturns(rows,primary.key,mode);
  for(const s of series.slice(1)){
    const targetReturns=alignedReturns(rows,s.key,mode),reg=regression(primaryReturns,targetReturns),lags=leadLag(primaryReturns,targetReturns,5);
    out.relations.push({primary:primary.key,target:s.key,correlation:corr(primaryReturns,targetReturns),covariance:cov(primaryReturns,targetReturns),beta:reg.beta,alpha:reg.alpha,r2:reg.r2,leadLag:lags.slice().sort((x,y)=>Math.abs(y.corr)-Math.abs(x.corr))[0],rolling:rollingCorrelation(primaryReturns,targetReturns,Math.min(rollingWindow,primaryReturns.length)),n:reg.n,observationHorizon:'shared calendar buckets; close-to-close',observations:rows.length,temporalAlignment:temporalRelationSummary(rows,primary.key,s.key),timingCaveat:'Same calendar bucket does not imply simultaneous market closes; inspect source timestamp offsets.'});
  }
  out.periods=series.length?out.series[series[0].key]?.annualizationPeriods:null;
  out.audit=auditAnalysis(out,series);
  return out;
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
