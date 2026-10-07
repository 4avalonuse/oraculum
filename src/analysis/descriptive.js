/* ORACULUM — estatística descritiva. Independente do núcleo. */
function mean(v){return v.length?v.reduce((a,b)=>a+b,0)/v.length:NaN}
function std(v){if(v.length<2)return NaN;const m=mean(v);return Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/(v.length-1))}
function quantile(v,q){if(!v.length)return NaN;const x=[...v].sort((a,b)=>a-b),i=(x.length-1)*q,f=Math.floor(i),c=Math.ceil(i);return x[f]+(x[c]-x[f])*(i-f)}
export function variance(v){return v.length>1?std(v)**2:NaN}
export function skewness(v){const n=v.length;if(n<3)return NaN;const m=mean(v),s=std(v);if(!s)return 0;return n/((n-1)*(n-2))*v.reduce((a,x)=>a+((x-m)/s)**3,0)}
export function kurtosis(v){const n=v.length;if(n<4)return NaN;const m=mean(v),s=std(v);if(!s)return 0;const sum=v.reduce((a,x)=>a+((x-m)/s)**4,0);return n*(n+1)/((n-1)*(n-2)*(n-3))*sum-3*(n-1)**2/((n-2)*(n-3))}
export function standardError(v){return v.length>1?std(v)/Math.sqrt(v.length):NaN}
export function describe(v){const x=v.filter(Number.isFinite),n=x.length;return {n,mean:mean(x),median:quantile(x,.5),variance:variance(x),std:std(x),se:standardError(x),min:x.length?Math.min(...x):NaN,max:x.length?Math.max(...x):NaN,q05:quantile(x,.05),q25:quantile(x,.25),q75:quantile(x,.75),q95:quantile(x,.95),skewness:skewness(x),excessKurtosis:kurtosis(x)}}
export function jarqueBera(v){const d=describe(v),n=d.n;if(n<8)return {stat:NaN,p:NaN};const stat=n/6*(d.skewness**2+d.excessKurtosis**2/4);return {stat,p:Math.exp(-stat/2)}}
