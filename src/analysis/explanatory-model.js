/* ORACULUM — modelo explicativo multivariado
   Responsabilidade: estimar quanto um conjunto de variáveis ajuda a explicar
   os retornos da série de referência. Não interpreta o resultado como causalidade.
*/
import {mean,returns} from './engine.js';

function transpose(a){return a[0].map((_,j)=>a.map(row=>row[j]))}
function multiply(a,b){
  return a.map(row=>b[0].map((_,j)=>row.reduce((s,_,k)=>s+row[k]*b[k][j],0)));
}
function inverse(matrix){
  const n=matrix.length, a=matrix.map((row,i)=>row.slice().concat(Array.from({length:n},(_,j)=>i===j?1:0)));
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let row=col+1;row<n;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
    if(Math.abs(a[pivot][col])<1e-12)return null;
    [a[col],a[pivot]]=[a[pivot],a[col]];
    const div=a[col][col];
    for(let j=0;j<2*n;j++)a[col][j]/=div;
    for(let row=0;row<n;row++){
      if(row===col)continue;
      const factor=a[row][col];
      for(let j=0;j<2*n;j++)a[row][j]-=factor*a[col][j];
    }
  }
  return a.map(row=>row.slice(n));
}
function normalP(t){
  const z=Math.abs(t),b=.2316419,p=.39894228*Math.exp(-z*z/2),q=1-p*b*(.31938153+b*(-.356563782+b*(1.781477937+b*(-1.821255978+b*1.330274429))));
  return Math.min(1,2*q);
}
function ols(y,x,names){
  const n=y.length,k=x[0].length;
  if(n<=k+2)return null;
  const xt=transpose(x),xtx=multiply(xt,x),inv=inverse(xtx);
  if(!inv)return null;
  const beta=multiply(multiply(inv,xt),y.map(v=>[v])).map(v=>v[0]);
  const fitted=x.map(row=>row.reduce((s,v,i)=>s+v*beta[i],0));
  const residuals=y.map((v,i)=>v-fitted[i]);
  const ybar=mean(y),sst=y.reduce((s,v)=>s+(v-ybar)**2,0),sse=residuals.reduce((s,v)=>s+v*v,0);
  const r2=sst>0?1-sse/sst:0,df=n-k,sigma2=sse/Math.max(1,df),covb=inv.map(row=>row.map(v=>v*sigma2));
  const coefficients=beta.map((value,i)=>{
    const se=Math.sqrt(Math.max(0,covb[i][i]));
    return {name:names[i],beta:value,se,t:se?value/se:NaN,p:se?normalP(value/se):NaN};
  });
  const predictors=k-1,adjusted=1-(1-r2)*(n-1)/Math.max(1,n-k);
  const f=predictors&&r2<1?(r2/predictors)/((1-r2)/Math.max(1,df)):NaN;
  return {n,k,predictors,r2,adjustedR2:adjusted,f,coefficients,fitted,residuals,sse,sst};
}

export function runExplanatoryModel(rows,series,options={}){
  if(!Array.isArray(rows)||!Array.isArray(series)||series.length<2)return {available:false,reason:'Selecione pelo menos uma variável além da referência.'};
  const mode=options.returnMode==='simple'?'simple':'log',target=series[0],returnsBySeries=series.map(s=>returns(rows.map(r=>r[s.key]),mode));
  const n=Math.min(...returnsBySeries.map(v=>v.length));
  if(n<Math.max(20,series.length*5))return {available:false,reason:'A amostra alinhada é pequena para um modelo multivariado confiável.',observations:n};
  const y=returnsBySeries[0].slice(-n),predictors=returnsBySeries.slice(1).map(v=>v.slice(-n));
  const x=y.map((_,i)=>[1,...predictors.map(v=>v[i])]);
  const names=['Intercepto',...series.slice(1).map(s=>s.symbol)];
  const fit=ols(y,x,names);
  if(!fit)return {available:false,reason:'Não foi possível estimar o modelo: as variáveis podem estar perfeitamente colineares ou ter variação insuficiente.'};
  return {
    available:true,target:target.symbol,predictors:series.slice(1).map(s=>s.symbol),
    observations:fit.n,returnMode:mode,r2:fit.r2,adjustedR2:fit.adjustedR2,f:fit.f,
    coefficients:fit.coefficients,fitted:fit.fitted,residuals:fit.residuals,
    sse:fit.sse,sst:fit.sst
  };
}
