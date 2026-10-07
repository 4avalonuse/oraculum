/* ORACULUM — diagnóstico formal inicial do modelo */
import {mean,std} from './engine.js';
function gammaln(z){const p=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,.001208650973866179,-.000005395239384953];let x=z,y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(let j=0;j<p.length;j++){y++;s+=p[j]/y}return -t+Math.log(2.5066282746310005*s/x)}
function gammaQ(a,x){if(x<0||a<=0)return NaN;if(x===0)return 1;if(x<a+1){let ap=a,sum=1/a,del=sum;for(let n=1;n<200;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*3e-14)break}return 1-sum*Math.exp(-x+a*Math.log(x)-gammaln(a))}let b=x+1-a,c=1e300,d=1/b,h=d;for(let i=1;i<200;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-14)break}return Math.exp(-x+a*Math.log(x)-gammaln(a))*h}
function chiP(stat,df){return Number.isFinite(stat)&&stat>=0?gammaQ(df/2,stat/2):NaN}
function acf(e,lag){const n=e.length,m=mean(e);let num=0,den=0;for(let i=0;i<n;i++)den+=(e[i]-m)**2;for(let i=lag;i<n;i++)num+=(e[i]-m)*(e[i-lag]-m);return den?num/den:NaN}
export function diagnoseModel(model){
 if(!model?.available)return {available:false};
 const e=model.residuals||[],m=mean(e),s=std(e),n=e.length;
 const dw=n>1?e.slice(1).reduce((sum,v,i)=>sum+(v-e[i])**2,0)/Math.max(1,e.reduce((sum,v)=>sum+v*v,0)):NaN;
 const lags=Math.max(1,Math.min(10,Math.floor(n/5)));let q=0;for(let j=1;j<=lags;j++){const r=acf(e,j);q+=r*r/Math.max(1,n-j)}q*=n*(n+2);
 const half=Math.max(2,Math.floor(n/2)),v1=std(e.slice(0,half))**2,v2=std(e.slice(half))**2;
 return {available:true,residualMean:m,residualStd:s,durbinWatson:dw,ljungBox:{stat:q,df:lags,p:chiP(q,lags)},varianceRatio:v1&&v2?Math.max(v1,v2)/Math.min(v1,v2):NaN,maxAbsResidual:n?Math.max(...e.map(Math.abs)):NaN,notes:{ljungBox:'Teste conjunto de autocorrelação até a defasagem indicada; p pequeno sugere dependência serial.',durbinWatson:'Diagnóstico de primeira ordem; não substitui testes gerais.',varianceRatio:'Comparação descritiva das variâncias entre metades da amostra.'}};
}
