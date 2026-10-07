export function mean(v){return v.reduce((a,b)=>a+b,0)/Math.max(1,v.length)}
export function median(v){const x=[...v].sort((a,b)=>a-b),m=Math.floor(x.length/2);return x.length?(x.length%2?x[m]:(x[m-1]+x[m])/2):NaN}
export function std(v){if(v.length<2)return 0;const m=mean(v);return Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/(v.length-1))}
export function cov(a,b){if(a.length<2)return 0;const ma=mean(a),mb=mean(b);return a.reduce((s,x,i)=>s+(x-ma)*(b[i]-mb),0)/(a.length-1)}
export function corr(a,b){const sa=std(a),sb=std(b);return sa&&sb?cov(a,b)/(sa*sb):0}
export function returns(values,mode='log'){const out=[];for(let i=1;i<values.length;i++){const a=values[i-1],b=values[i];if(a>0&&b>0)out.push(mode==='simple'?b/a-1:Math.log(b/a))}return out}
export function drawdown(values){let peak=values[0]||0,min=0,current=0;for(const value of values){if(value>=peak){peak=value;current=0}else{current++}min=Math.min(min,peak?value/peak-1:0)}return {max:min,recovery:current}}
export function regression(x,y){const beta=cov(x,y)/(cov(x,x)||1),alpha=mean(y)-beta*mean(x),r=corr(x,y);return {alpha,beta,r,r2:r*r}}
export function annualPeriods(interval){return interval==='1h'?8760:interval==='1w'?52:interval==='1M'?12:365}
export function cagr(first,last,years){return first>0&&last>0&&years>0?(last/first)**(1/years)-1:NaN}
export function sharpe(r,p){const s=std(r);return s?mean(r)/s*Math.sqrt(p):NaN}
export function sortino(r,p){const downside=r.filter(x=>x<0),s=std(downside);return s?mean(r)/s*Math.sqrt(p):NaN}
export function quantile(v,q){if(!v.length)return NaN;const x=[...v].sort((a,b)=>a-b),i=(x.length-1)*q,f=Math.floor(i),c=Math.ceil(i);return x[f]+(x[c]-x[f])*(i-f)}
export function leadLag(a,b,maxLag=5){const out=[];for(let lag=-maxLag;lag<=maxLag;lag++){const x=[],y=[];for(let i=0;i<a.length;i++){const j=i+lag;if(j>=0&&j<b.length){x.push(a[i]);y.push(b[j])}}out.push({lag,corr:corr(x,y)})}return out}
export function alignSeries(series){
  const maps=series.map(s=>new Map(s.candles.map(x=>[Number(x.timestamp),x])));
  const base=series[0].candles;
  return base.map(c=>{const row={timestamp:Number(c.timestamp)};for(let i=0;i<series.length;i++){const hit=maps[i].get(Number(c.timestamp));if(!hit||!Number.isFinite(hit.close))return null;row[series[i].key]=hit.close}return row}).filter(Boolean)
}
import {describe,jarqueBera} from './descriptive.js';
import {riskMetrics,calmar} from './risk.js';

export function analyzeSeries(rows,series,interval,options={}){
  const periods=annualPeriods(interval),mode=options.returnMode==='simple'?'simple':'log',rollingWindow=Math.max(5,Number(options.rollingWindow)||30),years=Math.max(1/periods,(rows.at(-1).timestamp-rows[0].timestamp)/(365.25*86400000)),out={interval,periods,years,observations:rows.length,returnMode:mode,rollingWindow,series:{},relations:[]};
  for(const s of series){
    const values=rows.map(r=>r[s.key]),r=returns(values,mode),dd=drawdown(values),dist={win:r.filter(x=>x>0).length/Math.max(1,r.length),best:Math.max(...r),worst:Math.min(...r),q25:quantile(r,.25),q75:quantile(r,.75)},d=describe(r),risk=riskMetrics(r,periods,options);
    out.series[s.key]={key:s.key,symbol:s.symbol,name:s.name,start:values[0],end:values.at(-1),total:values.at(-1)/values[0]-1,cagr:cagr(values[0],values.at(-1),years),vol:std(r)*Math.sqrt(periods),drawdown:dd.max,recovery:dd.recovery,sharpe:sharpe(r,periods),sortino:risk.sortino,downsideDeviation:risk.downsideDeviation,sharpe:risk.sharpe,var95:risk.var95,var99:risk.var99,es95:risk.es95,es99:risk.es99,calmar:calmar(cagr(values[0],values.at(-1),years),dd.max),mean:d.mean,median:d.median,variance:d.variance,std:d.std,se:d.se,q05:d.q05,q95:d.q95,skewness:d.skewness,excessKurtosis:d.excessKurtosis,jarqueBera:jarqueBera(r),winRate:dist.win,best:dist.best,worst:dist.worst,ath:Math.max(...values),atl:Math.min(...values),returns:r};
  }
  const primary=series[0],pr=out.series[primary.key].returns;
  for(const s of series.slice(1)){const sr=out.series[s.key].returns,n=Math.min(pr.length,sr.length),a=pr.slice(-n),b=sr.slice(-n),reg=regression(a,b),lags=leadLag(a,b,5);out.relations.push({primary:primary.key,target:s.key,correlation:corr(a,b),covariance:cov(a,b),beta:reg.beta,alpha:reg.alpha,r2:reg.r2,leadLag:lags.slice().sort((x,y)=>Math.abs(y.corr)-Math.abs(x.corr))[0],rolling:rollingCorrelation(a,b,Math.min(rollingWindow,n))})}
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
