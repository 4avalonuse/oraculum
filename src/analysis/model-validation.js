export function validateModelTwoWays(model){
 if(!model?.available||!model.auditDesign?.x||!model.auditDesign?.y)return {status:'NOT_CHECKED',passed:0,total:0,checks:[],reason:model?.reason||'Modelo indisponível ou desenho de auditoria ausente.',validationScope:'cross-implementation-numerical-reproduction',independentlyValidated:false,economicValidity:'NOT_ASSESSED'};
 const x=model.auditDesign.x,y=model.auditDesign.y,n=y.length,k=x[0]?.length||0;
 const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
 const trans=a=>a[0].map((_,j)=>a.map(r=>r[j]));
 const mul=(a,b)=>a.map(r=>b[0].map((_,j)=>r.reduce((s,v,z)=>s+v*b[z][j],0)));
 const mv=(a,v)=>a.map(r=>r.reduce((s,z,j)=>s+z*v[j],0));
 const inv=m=>{const n=m.length,a=m.map((r,i)=>r.concat(Array.from({length:n},(_,j)=>i===j?1:0)));for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(a[r][c])>Math.abs(a[p][c]))p=r;if(Math.abs(a[p][c])<1e-14)return null;[a[c],a[p]]=[a[p],a[c]];const d=a[c][c];for(let j=0;j<2*n;j++)a[c][j]/=d;for(let r=0;r<n;r++)if(r!==c){const f=a[r][c];for(let j=0;j<2*n;j++)a[r][j]-=f*a[c][j]}}return a.map(r=>r.slice(n))};
 const close=(a,b,t=1e-7)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));
 if(n<=k+2||x.length!==n||x.some(r=>r.length!==k||r.some(v=>!Number.isFinite(v)))||y.some(v=>!Number.isFinite(v)))return {status:'NOT_CHECKED',passed:0,total:0,checks:[],reason:'Amostra insuficiente ou desenho X/Y contém valores ausentes/não finitos.',validationScope:'cross-implementation-numerical-reproduction',independentlyValidated:false,economicValidity:'NOT_ASSESSED'};
 const xt=trans(x),bread=inv(mul(xt,x));if(!bread)return {status:'ALERT',passed:0,total:1,checks:[{name:'matriz invertível',status:'FAIL'}]};
 const beta=mv(bread,mv(xt,y));
 const fitted=mv(x,beta),e=y.map((v,i)=>v-fitted[i]),sse=e.reduce((s,v)=>s+v*v,0),ym=mean(y),sst=y.reduce((s,v)=>(s+(v-ym)**2),0),r2=1-sse/sst;
 const checks=[],add=(name,a,b,t=1e-7)=>checks.push({name,status:close(a,b,t)?'PASS':'FAIL',primary:Number.isFinite(a)?a:null,reference:Number.isFinite(b)?b:null});
 const diff=(a,b)=>a.length===b.length?Math.max(0,...a.map((v,i)=>Math.abs(v-b[i]))):Infinity;
 add('OLS coeficientes',diff(model.coefficients.map(c=>c.beta),beta),0);
 add('OLS valores ajustados',diff(model.fitted,fitted),0);
 add('OLS resíduos',diff(model.residuals,e),0);
 add('OLS SSE',model.sse,sse);
 add('OLS R²',model.r2,r2);
 const L=Math.max(0,Math.min(model.hacLag||0,n-1)),meat=Array.from({length:k},()=>Array(k).fill(0));
 for(let t=0;t<n;t++)for(let i=0;i<k;i++)for(let j=0;j<k;j++)meat[i][j]+=e[t]**2*x[t][i]*x[t][j];
 for(let lag=1;lag<=L;lag++){const w=1-lag/(L+1);for(let t=lag;t<n;t++)for(let i=0;i<k;i++)for(let j=0;j<k;j++)meat[i][j]+=e[t]*e[t-lag]*w*(x[t][i]*x[t-lag][j]+x[t-lag][i]*x[t][j])}
 const hac=mul(mul(bread,meat),bread).map(r=>r.map(v=>v*n/(n-k))),se=hac.map((r,i)=>Math.sqrt(Math.max(0,r[i]))),actual=(model.hacCoefficients||[]).map(c=>c.hacSe);
 add('HAC erros-padrão Newey–West',diff(actual,se),0,2e-6);
 const passed=checks.filter(c=>c.status==='PASS').length,failed=checks.some(c=>c.status==='FAIL');
 return {status:failed?'ALERT':'BOTH_PATHS_AGREE',passed,total:checks.length,checks,message:failed?'Divergência entre os caminhos de cálculo.':'Os dois caminhos numéricos concordam dentro das tolerâncias.',validationScope:'cross-implementation-numerical-reproduction',crossChecked:!failed,independentlyValidated:false,externalReferenceValidation:'PENDING',economicValidity:'NOT_ASSESSED'};
}

/* Independent recomputation of residual diagnostics.
   This validates numerical reproduction, not the statistical assumptions behind
   conventional p-values or the economic adequacy of the model. */
export function validateResidualDiagnostics(model, diagnostics) {
 const e=model?.residuals, d=diagnostics;
 if(!model?.available||!Array.isArray(e)||!d?.available||e.length<3||!e.every(Number.isFinite))
  return {status:'NOT_CHECKED',passed:0,total:0,checks:[],reason:'Modelo ou sequência de resíduos indisponível.',validationScope:'independent-residual-numerical-reproduction',economicValidity:'NOT_ASSESSED'};
 const close=(a,b,t=1e-8)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));
 const add=(name,a,b,t=1e-8)=>checks.push({name,status:close(a,b,t)?'PASS':'FAIL',primary:Number.isFinite(a)?a:null,reference:Number.isFinite(b)?b:null});
 const checks=[],n=e.length,mean=e.reduce((s,v)=>s+v,0)/n;
 const denominator=e.reduce((s,v)=>s+v*v,0);
 const dwNumerator=e.slice(1).reduce((s,v,i)=>s+(v-e[i])**2,0);
 const dw=denominator>0?dwNumerator/denominator:NaN;
 const centered=e.map(v=>v-mean),variance=centered.reduce((s,v)=>s+v*v,0);
 const acfAt=lag=>variance>0?centered.slice(lag).reduce((s,v,i)=>s+v*centered[i],0)/variance:NaN;
 const lagCount=Math.max(1,Math.min(10,Math.floor(n/5)));
 let q=0;for(let lag=1;lag<=lagCount;lag++){const rho=acfAt(lag);q+=rho*rho/Math.max(1,n-lag)}q*=n*(n+2);
 add('Quantidade de resíduos',d.residualCount,n,0);
 add('Durbin–Watson',d.durbinWatson,dw);
 add('Correlação residual lag 1',d.residualLag1Correlation,acfAt(1));
 add('Ljung–Box Q',d.ljungBox?.stat,q);
 add('Defasagens Ljung–Box',d.ljungBox?.lagsUsed??d.ljungBox?.df,lagCount,0);
 const firstLagContribution=n*(n+2)*(acfAt(1)**2)/Math.max(1,n-1);
 checks.push({name:'Ljung–Box Q contém contribuição da defasagem 1',status:Number.isFinite(q)&&q+1e-10>=firstLagContribution?'PASS':'FAIL',primary:q,reference:firstLagContribution});
 const elapsedBySeries=model.auditDesign?.elapsedDaysBySeries||{},primaryKey=Object.keys(elapsedBySeries)[0],intervals=(elapsedBySeries[primaryKey]||[]).filter(v=>Number.isFinite(v)&&v>0),sorted=intervals.slice().sort((a,b)=>a-b),med=sorted.length?sorted[Math.floor((sorted.length-1)/2)]:NaN;
 const regular=intervals.length===n&&med>0&&intervals.every(v=>Math.abs(v-med)<=Math.max(.05,med*.1));
 if(d.temporalSpacing?.status==='REGULAR_INTERVALS'&&!regular)checks.push({name:'Classificação de espaçamento temporal',status:'FAIL',primary:d.temporalSpacing.status,reference:'IRREGULAR_INTERVALS'});
 const passed=checks.filter(c=>c.status==='PASS').length,failed=checks.some(c=>c.status==='FAIL');
 return {status:failed?'ALERT':'BOTH_PATHS_AGREE',passed,total:checks.length,checks,message:failed?'Os diagnósticos dos resíduos divergem da recomputação independente ou falham uma condição de consistência.':'A recomputação independente dos diagnósticos coincide dentro das tolerâncias.',validationScope:'independent-residual-numerical-reproduction',independentlyValidated:true,economicValidity:'NOT_ASSESSED',residualCount:n,firstLagContributionToLjungBox:firstLagContribution,warning:regular?'': 'A validação numérica não torna válidos os p-valores convencionais quando o espaçamento temporal é irregular ou os pressupostos do teste não são atendidos.'};
}
