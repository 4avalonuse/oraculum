/* ORACULUM — modelo explicativo multivariado
   Responsabilidade: OLS + inferência clássica + HAC(Newey-West) + VIF.
   Associação estatística; não interpreta o resultado como causalidade.
*/
import {mean,alignedReturns} from './engine.js';

function transpose(a){return a[0].map((_,j)=>a.map(row=>row[j]))}
function multiply(a,b){return a.map(row=>b[0].map((_,j)=>row.reduce((s,_,k)=>s+row[k]*b[k][j],0)))}
function inverse(matrix){const n=matrix.length,a=matrix.map((row,i)=>row.slice().concat(Array.from({length:n},(_,j)=>i===j?1:0)));for(let col=0;col<n;col++){let pivot=col;for(let row=col+1;row<n;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;if(Math.abs(a[pivot][col])<1e-12)return null;[a[col],a[pivot]]=[a[pivot],a[col]];const d=a[col][col];for(let j=0;j<2*n;j++)a[col][j]/=d;for(let row=0;row<n;row++){if(row===col)continue;const f=a[row][col];for(let j=0;j<2*n;j++)a[row][j]-=f*a[col][j]}}return a.map(row=>row.slice(n))}
function gammaln(z){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,.001208650973866179,-.000005395239384953];let x=z,y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(let j=0;j<c.length;j++){y++;s+=c[j]/y}return -t+Math.log(2.5066282746310005*s/x)}
function betaCF(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;for(let m=1;m<=200;m++){let m2=2*m,aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-14)break}return h}
function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(gammaln(a+b)-gammaln(a)-gammaln(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betaCF(a,b,x)/a:1-bt*betaCF(b,a,1-x)/b}
function tCDF(t,df){if(!Number.isFinite(t)||df<=0)return NaN;if(t===0)return .5;const x=df/(df+t*t),p=.5*ibeta(x,df/2,.5);return t>0?1-p:p}
function tP(t,df){if(!Number.isFinite(t)||!(df>0))return NaN;const x=df/(df+t*t);return Math.min(1,Math.max(0,ibeta(x,df/2,.5)))}
function normalP(z){if(!Number.isFinite(z))return NaN;const x=Math.abs(z),p=0.2316419,b1=0.319381530,b2=-0.356563782,b3=1.781477937,b4=-1.821255978,b5=1.330274429,t=1/(1+p*x),phi=Math.exp(-x*x/2)/Math.sqrt(2*Math.PI),tail=phi*(b1*t+b2*t*t+b3*t**3+b4*t**4+b5*t**5);return Math.min(1,2*tail)}
function tCritical(alpha,df){let lo=0,hi=20;for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(tCDF(mid,df)<1-alpha/2)lo=mid;else hi=mid}return (lo+hi)/2}
function fP(f,d1,d2){if(!(f>=0&&d1>0&&d2>0))return NaN;if(f===Infinity)return 0;const x=d2/(d1*f+d2);return Math.min(1,Math.max(0,ibeta(x,d2/2,d1/2)))}
function ols(y,x,names){
  const n=y.length,k=x[0].length;if(n<=k+2)return null;
  const xt=transpose(x),xtx=multiply(xt,x),inv=inverse(xtx);if(!inv)return null;
  const beta=multiply(multiply(inv,xt),y.map(v=>[v])).map(v=>v[0]),fitted=x.map(row=>row.reduce((s,v,i)=>s+v*beta[i],0)),residuals=y.map((v,i)=>v-fitted[i]);
  const ybar=mean(y),sst=y.reduce((s,v)=>s+(v-ybar)**2,0),sse=residuals.reduce((s,v)=>s+v*v,0);if(!(sst>1e-24))return null;const r2=1-sse/sst,df=n-k,sigma2=sse/Math.max(1,df);
  const covb=inv.map(row=>row.map(v=>v*sigma2)),critical=tCritical(.05,df);
  const coefficients=beta.map((value,i)=>{const se=Math.sqrt(Math.max(0,covb[i][i])),t=se?value/se:NaN;return {name:names[i],beta:value,se,t,p:tP(t,df),ciLow:value-critical*se,ciHigh:value+critical*se}});
  const predictors=k-1,adjusted=1-(1-r2)*(n-1)/Math.max(1,n-k),f=predictors&&r2<1?(r2/predictors)/((1-r2)/Math.max(1,df)):NaN;
  return {n,k,predictors,r2,adjustedR2:adjusted,f,fP:fP(f,predictors,df),df,coefficients,fitted,residuals,sse,sst,rmse:Math.sqrt(sse/Math.max(1,df))};
}
function hacCovariance(x,e,inv,lag){
  const n=e.length,k=x[0].length,S=Array.from({length:k},()=>Array(k).fill(0)),L=Math.max(0,Math.min(lag,n-1));
  for(let t=0;t<n;t++)for(let i=0;i<k;i++)for(let j=0;j<k;j++)S[i][j]+=e[t]*e[t]*x[t][i]*x[t][j];
  for(let l=1;l<=L;l++){const w=1-l/(L+1);for(let t=l;t<n;t++)for(let i=0;i<k;i++)for(let j=0;j<k;j++){const z=e[t]*e[t-l]*w;S[i][j]+=z*(x[t][i]*x[t-l][j]+x[t-l][i]*x[t][j])}}
  const out=multiply(multiply(inv,S),inv),correction=n>k?n/(n-k):1;return out.map(row=>row.map(v=>v*correction));
}
function vifValues(predictors){
  const k=predictors.length;
  if(k<2)return [];
  const n=Math.min(...predictors.map(v=>v.length));
  if(!Number.isFinite(n)||n<2)return predictors.map((_,index)=>({index,vif:NaN,r2:NaN}));
  const out=[];
  for(let j=0;j<k;j++){
    const y=predictors[j].slice(0,n);
    const others=predictors.filter((_,i)=>i!==j);
    const x=Array.from({length:n},(_,row)=>[1,...others.map(v=>v[row])]);
    const xt=transpose(x),inv=inverse(multiply(xt,x));
    if(!inv){out.push({index:j,vif:Infinity,r2:1});continue}
    const b=multiply(multiply(inv,xt),y.map(v=>[v])).map(v=>v[0]);
    const fit=x.map(row=>row.reduce((sum,v,i)=>sum+v*b[i],0));
    const m=mean(y),sst=y.reduce((sum,v)=>sum+(v-m)**2,0),sse=y.reduce((sum,v,i)=>sum+(v-fit[i])**2,0);
    if(!(sst>1e-24)){out.push({index:j,vif:NaN,r2:NaN});continue}
    const r2=Math.max(0,Math.min(1,1-sse/sst));
    out.push({index:j,vif:r2>=1-1e-12?Infinity:1/(1-r2),r2});
  }
  return out;
}
export function runExplanatoryModel(rows,series,options={}){
  if(!Array.isArray(rows)||!Array.isArray(series)||series.length<2)return {available:false,reason:'Selecione pelo menos uma variável além da referência.'};
  const mode=options.returnMode==='simple'?'simple':'log',target=series[0],returnsBySeries=series.map(s=>alignedReturns(rows,s.key,mode)),rowCount=Math.min(...returnsBySeries.map(v=>v.length)),returnRows=Array.from({length:rowCount},(_,i)=>returnsBySeries.map(v=>v[i])).filter(row=>row.every(Number.isFinite)),n=returnRows.length;
  if(n<Math.max(20,series.length*5))return {available:false,reason:'A amostra alinhada é pequena para um modelo multivariado confiável.',observations:n};
  const y=returnRows.map(row=>row[0]),predictors=series.slice(1).map((_,i)=>returnRows.map(row=>row[i+1])),x=y.map((_,i)=>[1,...predictors.map(v=>v[i])]),names=['Intercepto',...series.slice(1).map(s=>s.symbol)],fit=ols(y,x,names);
  if(!fit)return {available:false,reason:'Não foi possível estimar o modelo: colinearidade perfeita ou variação insuficiente.'};
  const inv=inverse(multiply(transpose(x),x)),requestedLag=options.hacLag==null?Math.floor(4*Math.pow(n/100,2/9)):Number(options.hacLag),lag=Number.isFinite(requestedLag)?Math.max(0,Math.min(n-1,Math.floor(requestedLag))):Math.floor(4*Math.pow(n/100,2/9)),hac=inv?hacCovariance(x,fit.residuals,inv,lag):null;
  const hacCoefficients=fit.coefficients.map((c,i)=>{const se=hac?Math.sqrt(Math.max(0,hac[i][i])):NaN,t=se?c.beta/se:NaN;return {...c,hacSe:se,hacT:t,hacP:normalP(t)}});
  return {available:true,target:target.symbol,predictors:series.slice(1).map(s=>s.symbol),observations:fit.n,returnMode:mode,r2:fit.r2,adjustedR2:fit.adjustedR2,f:fit.f,fP:fit.fP,df:fit.df,coefficients:fit.coefficients,hacCoefficients,fitted:fit.fitted,residuals:fit.residuals,sse:fit.sse,sst:fit.sst,rmse:fit.rmse,hacLag:lag,vif:vifValues(predictors)};
}
