/* ORACULUM — risco e performance. Independente do núcleo. */
function mean(v){return v.length?v.reduce((a,b)=>a+b,0)/v.length:NaN}
function std(v){if(v.length<2)return NaN;const m=mean(v);return Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/(v.length-1))}
function quantile(v,q){if(!v.length)return NaN;const x=[...v].sort((a,b)=>a-b),i=(x.length-1)*q,f=Math.floor(i),c=Math.ceil(i);return x[f]+(x[c]-x[f])*(i-f)}
export function downsideDeviation(r,target=0){const x=r.filter(Number.isFinite),d=x.map(v=>Math.min(v-target,0)**2);return d.length?Math.sqrt(d.reduce((a,b)=>a+b,0)/d.length):NaN}
export function sharpeRatio(r,periods=365,riskFreePerPeriod=0){const e=r.map(v=>v-riskFreePerPeriod),s=std(e);return s?mean(e)/s*Math.sqrt(periods):NaN}
export function sortinoRatio(r,periods=365,targetPerPeriod=0){const dd=downsideDeviation(r,targetPerPeriod);return dd?(mean(r)-targetPerPeriod)/dd*Math.sqrt(periods):NaN}
export function historicalVaR(r,level=.95){const q=quantile(r,1-level);return Number.isFinite(q)?-q:NaN}
export function expectedShortfall(r,level=.95){const x=r.filter(Number.isFinite).sort((a,b)=>a-b),cut=(1-level)*x.length;if(!x.length||cut<=0)return NaN;const k=Math.floor(cut),f=cut-k;let sum=0;for(let i=0;i<k;i++)sum+=x[i];if(k<x.length)sum+=f*x[k];return -sum/cut}
export function calmar(cagrValue,maxDrawdown){return maxDrawdown<0?cagrValue/Math.abs(maxDrawdown):NaN}
export function riskMetrics(r,periods,options={}){const rf=Number(options.riskFreePerPeriod)||0,target=Number(options.sortinoTargetPerPeriod)||0;return {sharpe:sharpeRatio(r,periods,rf),sortino:sortinoRatio(r,periods,target),downsideDeviation:downsideDeviation(r,target),var95:historicalVaR(r,.95),var99:historicalVaR(r,.99),es95:expectedShortfall(r,.95),es99:expectedShortfall(r,.99),riskFreePerPeriod:rf,sortinoTargetPerPeriod:target}}
