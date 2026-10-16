/* ORACULUM — testes de heterocedasticidade e variância condicional
   Breusch–Pagan, White e ARCH-LM.
   Os testes são diagnósticos; não demonstram causalidade nem validam o modelo inteiro.
*/
import { mean } from './engine.js';

function transpose(a){return a[0].map((_,j)=>a.map(row=>row[j]))}
function multiply(a,b){return a.map(row=>b[0].map((_,j)=>row.reduce((s,_,k)=>s+row[k]*b[k][j],0)))}
function inverse(matrix){
  const n=matrix.length,a=matrix.map((row,i)=>row.slice().concat(Array.from({length:n},(_,j)=>i===j?1:0)));
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let row=col+1;row<n;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
    if(Math.abs(a[pivot][col])<1e-10)return null;
    [a[col],a[pivot]]=[a[pivot],a[col]];
    const d=a[col][col];for(let j=0;j<2*n;j++)a[col][j]/=d;
    for(let row=0;row<n;row++){if(row===col)continue;const f=a[row][col];for(let j=0;j<2*n;j++)a[row][j]-=f*a[col][j]}
  }
  return a.map(row=>row.slice(n));
}
function gammaln(z){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,.001208650973866179,-.000005395239384953];let x=z,y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(let j=0;j<c.length;j++){y++;s+=c[j]/y}return -t+Math.log(2.5066282746310005*s/x)}
function gammaQ(a,x){
  if(x<0||a<=0)return NaN;if(x===0)return 1;
  if(x<a+1){let ap=a,sum=1/a,del=sum;for(let n=1;n<300;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*3e-14)break}return Math.max(0,Math.min(1,1-sum*Math.exp(-x+a*Math.log(x)-gammaln(a))))}
  let b=x+1-a,c=1e300,d=1/b,h=d;
  for(let i=1;i<300;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-14)break}
  return Math.max(0,Math.min(1,Math.exp(-x+a*Math.log(x)-gammaln(a))*h));
}
function chiSquareP(stat,df){return Number.isFinite(stat)&&stat>=0&&df>0?gammaQ(df/2,stat/2):NaN}
function auxiliaryR2(y,columns){
  const n=y.length;
  if(n<8)return null;
  // Normalize columns, then remove linear dependencies before fitting.
  // The effective degrees of freedom are the rank of the auxiliary design
  // excluding the intercept, not the number of terms we attempted to add.
  const scales=columns.map(col=>col.reduce((m,v)=>Math.max(m,Math.abs(v)),0));
  if(scales.some(s=>!Number.isFinite(s)))return null;
  const scaled=columns.map((col,j)=>scales[j]>0?col.map(v=>v/scales[j]):col.map(()=>0));
  const independent=[],basis=[];
  for(const col of scaled){
    const avg=mean(col),centered=col.map(v=>v-avg);
    const originalNorm=Math.sqrt(centered.reduce((sum,v)=>sum+v*v,0));
    if(!(originalNorm>1e-12))continue;
    const residual=centered.slice();
    for(const q of basis){
      const projection=residual.reduce((sum,v,i)=>sum+v*q[i],0);
      for(let i=0;i<n;i++)residual[i]-=projection*q[i];
    }
    const norm=Math.sqrt(residual.reduce((sum,v)=>sum+v*v,0));
    if(!(norm>1e-10*originalNorm))continue;
    basis.push(residual.map(v=>v/norm));
    independent.push(col);
  }
  const df=independent.length;
  const avg=mean(y),sst=y.reduce((sum,v)=>sum+(v-avg)**2,0);
  if(df===0)return {r2:0,df:0};
  if(n<=df+3)return null;
  if(!(sst>1e-24))return {r2:0,df}; // Resposta auxiliar constante: LM=0, sem evidência contra H0.
  const x=Array.from({length:n},(_,i)=>[1,...independent.map(col=>col[i])]);
  const xt=transpose(x),inv=inverse(multiply(xt,x));if(!inv)return null;
  const beta=multiply(multiply(inv,xt),y.map(v=>[v])).map(row=>row[0]);
  const fitted=x.map(row=>row.reduce((sum,v,j)=>sum+v*beta[j],0));
  const sse=y.reduce((sum,v,i)=>sum+(v-fitted[i])**2,0);
  return {r2:Math.max(0,Math.min(1,1-sse/sst)),df};
}
function unavailable(method,reason){return {method,available:false,reason,statistic:null,df:null,pValue:null,interpretation:'INCONCLUSIVE'}}
function result(method,statistic,df,pValue,n,details={}){
  const validPValue=Number.isFinite(pValue)&&pValue>=0&&pValue<=1;
  return {method,available:true,statistic,df,pValue,n,interpretation:!validPValue?'INCONCLUSIVE':pValue<0.05?'EVIDENCE_AGAINST_CONSTANT_VARIANCE':'NO_STRONG_EVIDENCE_AGAINST_NULL',alpha:0.05,...details};
}
function validInput(residuals,predictors){
  if(!Array.isArray(residuals)||!Array.isArray(predictors)||!predictors.length)return 'Resíduos e ao menos um preditor são necessários.';
  const n=residuals.length;
  if(n<12||predictors.some(x=>!Array.isArray(x)||x.length!==n))return 'A amostra é pequena ou os preditores não estão alinhados.';
  if(!residuals.every(Number.isFinite)||predictors.some(x=>!x.every(Number.isFinite)))return 'Há valores ausentes ou não finitos.';
  if(!(residuals.reduce((s,v)=>s+v*v,0)>1e-24))return 'Resíduos sem variação: teste não identificável.';
  return null;
}
export function breuschPagan(residuals,predictors){
  const reason=validInput(residuals,predictors);if(reason)return unavailable('Breusch–Pagan',reason);
  const y=residuals.map(v=>v*v),aux=auxiliaryR2(y,predictors);
  if(aux===null||aux.df<1)return unavailable('Breusch–Pagan','A regressão auxiliar não tem graus de liberdade identificáveis ou a amostra é insuficiente.');
  const df=aux.df,statistic=residuals.length*aux.r2;
  return result('Breusch–Pagan',statistic,df,chiSquareP(statistic,df),residuals.length,{rSquaredAuxiliary:aux.r2,nullHypothesis:'A variância condicional dos resíduos não depende linearmente dos preditores.',formula:'LM = n × R² da regressão auxiliar de resíduos² sobre os preditores.'});
}
export function whiteTest(residuals,predictors){
  const reason=validInput(residuals,predictors);if(reason)return unavailable('White',reason);
  const columns=predictors.slice();
  for(let i=0;i<predictors.length;i++)columns.push(predictors[i].map(v=>v*v));
  for(let i=0;i<predictors.length;i++)for(let j=i+1;j<predictors.length;j++)columns.push(predictors[i].map((v,k)=>v*predictors[j][k]));
  const y=residuals.map(v=>v*v),aux=auxiliaryR2(y,columns);
  if(aux===null||aux.df<1)return unavailable('White','A regressão auxiliar não tem graus de liberdade identificáveis ou a amostra é insuficiente; reduza preditores redundantes.');
  const df=aux.df,statistic=residuals.length*aux.r2;
  return result('White',statistic,df,chiSquareP(statistic,df),residuals.length,{rSquaredAuxiliary:aux.r2,auxiliaryTerms:df,nullHypothesis:'A variância condicional é constante contra alternativas relacionadas a preditores, quadrados e interações.',formula:'LM = n × R² da regressão auxiliar de resíduos² sobre preditores, quadrados e interações.'});
}
export function archLM(residuals,lag=1){
  if(!Array.isArray(residuals)||residuals.length<15||!residuals.every(Number.isFinite))return unavailable('ARCH-LM','São necessários pelo menos 15 resíduos finitos.');
  const q=Math.floor(Number(lag));
  if(!Number.isFinite(q)||q<1||q>Math.floor(residuals.length/4))return unavailable('ARCH-LM','Defasagem inválida para o tamanho da amostra.');
  const squares=residuals.map(v=>v*v),y=squares.slice(q),columns=Array.from({length:q},(_,j)=>squares.slice(q-j-1,squares.length-j-1)),aux=auxiliaryR2(y,columns);
  if(aux===null||aux.df<1)return unavailable('ARCH-LM','As defasagens dos resíduos ao quadrado não têm variação independente suficiente para identificar o teste.');
  const df=aux.df,statistic=y.length*aux.r2;
  return result('ARCH-LM',statistic,df,chiSquareP(statistic,df),y.length,{lag:q,rSquaredAuxiliary:aux.r2,nullHypothesis:'Não há efeito ARCH até a defasagem especificada.',formula:'LM = n_eff × R² de resíduos² sobre suas próprias defasagens.'});
}
export function diagnoseHeteroskedasticity(model,options={}){
  if(!model?.available||!Array.isArray(model.residuals)||!Array.isArray(model.auditDesign?.x))return {available:false,reason:'Modelo e desenho da regressão não disponíveis.'};
  const x=model.auditDesign.x,predictorCount=x[0]?.length-1;
  if(predictorCount<1)return {available:false,reason:'Não há preditores para os testes de variância.'};
  const predictors=Array.from({length:predictorCount},(_,j)=>x.map(row=>row[j+1]));
  const bp=breuschPagan(model.residuals,predictors),white=whiteTest(model.residuals,predictors),arch=archLM(model.residuals,options.archLag??Math.max(1,Math.min(5,Math.floor(model.residuals.length**0.25))));
  return {available:true,alpha:0.05,tests:[bp,white,arch],notes:[
    'p < 0,05 indica evidência contra a hipótese nula específica; p ≥ 0,05 não prova variância constante.',
    'White pode ficar indisponível quando os termos auxiliares são colineares ou a amostra é pequena.',
    'ARCH-LM investiga dependência temporal da variância; não é equivalente a Breusch–Pagan ou White.',
    'Os valores-p usam aproximação assintótica qui-quadrado e podem ser pouco confiáveis em amostras pequenas.',
    'A escolha de HAC/Newey–West deve considerar heterocedasticidade e autocorrelação; HAC não substitui estes diagnósticos.'
  ]};
}
