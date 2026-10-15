import test from 'node:test';
import assert from 'node:assert/strict';
import { runExplanatoryModel } from '../src/analysis/explanatory-model.js';
import { validateModelTwoWays, validateResidualDiagnostics } from '../src/analysis/model-validation.js';
import { diagnoseModel } from '../src/analysis/model-diagnostics.js';

test('independent model validation agrees on a deterministic sample',()=>{
 const rows=[];let a=100,b=50,c=80;const start=Date.UTC(2024,0,1),day=86400000;rows.push({timestamp:start,A:a,B:b,C:c});
 for(let i=0;i<180;i++){const ra=.0004+.012*Math.sin(i*.37)+.004*Math.cos(i*.13),rb=.0002+1.35*ra+.003*Math.sin(i*.71),rc=-.0001+.25*ra+.009*Math.cos(i*.29);a*=Math.exp(ra);b*=Math.exp(rb);c*=Math.exp(rc);rows.push({timestamp:start+(i+1)*day,A:a,B:b,C:c})}
 const model=runExplanatoryModel(rows,[{key:'A',symbol:'A'},{key:'B',symbol:'B'},{key:'C',symbol:'C'}],{returnMode:'log',hacLag:5});
 assert.equal(model.available,true);
 assert.equal(model.hacMethod,'Newey–West with Bartlett weights');
 assert.equal(model.hacFiniteSampleCorrection,'n/(n-k)');
 assert.equal(model.hacPValueMethod,'two-sided asymptotic normal approximation');
 assert.ok(Math.abs(model.rmse-Math.sqrt(model.sse/model.observations))<1e-12,'RMSE must divide SSE by n');
 assert.ok(Math.abs(model.residualStandardError-Math.sqrt(model.sse/model.df))<1e-12,'residual standard error must divide SSE by residual degrees of freedom');
 const result=validateModelTwoWays(model);assert.equal(result.status,'BOTH_PATHS_AGREE',JSON.stringify(result.checks));assert.equal(result.passed,result.total);assert.equal(result.economicValidity,'NOT_ASSESSED');
});
test('missing model is not marked confirmed',()=>assert.equal(validateModelTwoWays({available:false}).status,'NOT_CHECKED'));


// Independent fixed reference values computed with Python statsmodels OLS and
// cov_type="HAC", maxlags=5, use_correction=True, kernel="bartlett".
// These constants are intentionally not calculated by Oraculum's estimator.
test('OLS and Newey–West inference match independent statsmodels reference values',()=>{
 const rows=[];let a=100,b=50,c=80;const start=Date.UTC(2024,0,1),day=86400000;rows.push({timestamp:start,A:a,B:b,C:c});
 for(let i=0;i<180;i++){const ra=.0004+.012*Math.sin(i*.37)+.004*Math.cos(i*.13),rb=.0002+1.35*ra+.003*Math.sin(i*.71),rc=-.0001+.25*ra+.009*Math.cos(i*.29);a*=Math.exp(ra);b*=Math.exp(rb);c*=Math.exp(rc);rows.push({timestamp:start+(i+1)*day,A:a,B:b,C:c})}
 const model=runExplanatoryModel(rows,[{key:'A',symbol:'A'},{key:'B',symbol:'B'},{key:'C',symbol:'C'}],{returnMode:'log',hacLag:5});
 assert.equal(model.available,true);
 const close=(actual,expected,tol=2e-7)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol*Math.max(Math.abs(expected),1e-10)+1e-12,'actual='+actual+'; expected='+expected);
 close(model.coefficients[0].beta,-0.00014700697908324892);
 close(model.coefficients[1].beta,0.7159194557117554);
 close(model.coefficients[2].beta,0.01576856170414032);
 close(model.coefficients[0].se,0.00011653941477952037);
 close(model.coefficients[1].se,0.010284118060476508);
 close(model.coefficients[2].se,0.018290682911411314);
 close(model.coefficients[0].t,-1.2614357070641704);
 close(model.coefficients[1].t,69.61408372616287);
 close(model.coefficients[2].t,0.8621089644664127);
 close(model.coefficients[0].p,0.2088118470266409,2e-6);
 close(model.coefficients[2].p,0.38979405591675315,2e-6);
 close(model.coefficients[0].ciLow,-0.0003769925264494207);
 close(model.coefficients[0].ciHigh,0.00008297856828292288);
 close(model.coefficients[1].ciLow,0.6956241888632672);
 close(model.coefficients[1].ciHigh,0.7362147225602437);
 close(model.hacCoefficients[0].hacSe,0.00012296099976202707);
 close(model.hacCoefficients[1].hacSe,0.013820957201039635);
 close(model.hacCoefficients[2].hacSe,0.0244580396838111);
 close(model.hacCoefficients[0].hacT,-1.1955577733408096);
 close(model.hacCoefficients[0].hacP,0.23186917820491282,2e-6);
 close(model.hacCoefficients[2].hacP,0.519109332613193,2e-6);
 close(model.r2,0.9703374816199366);
 close(model.f,2895.063258724595,2e-6);
});


test('model audit design preserves exact source timestamps and elapsed intervals for retained residual rows',()=>{
 const rows=[];let a=100,b=50;const times=Array.from({length:46},(_,i)=>i+Math.floor(i/3));const start=Date.UTC(2024,0,1),day=86400000;
 rows.push({timestamp:start,A:a,B:b,__sourceTimestamps:{A:start,B:start+6*3600000}});
 for(let i=1;i<times.length;i++){a*=Math.exp(.01*Math.sin(i*.7)+.002);b*=Math.exp(.008*Math.cos(i*.31)+.001);const ts=start+times[i]*day;rows.push({timestamp:ts,A:a,B:b,__sourceTimestamps:{A:ts,B:ts+6*3600000}})}
 const model=runExplanatoryModel(rows,[{key:'A',symbol:'A'},{key:'B',symbol:'B'}],{hacLag:2});
 assert.equal(model.available,true,model.reason);
 assert.equal(model.auditDesign.timestamps.length,model.residuals.length);
 assert.equal(model.auditDesign.elapsedDaysBySeries.A.length,model.residuals.length);
 assert.ok(model.auditDesign.elapsedDaysBySeries.A.some(v=>v>1));
 assert.ok(model.auditDesign.sourceTimestampsBySeries.B.every((v,i)=>v-model.auditDesign.sourceTimestampsBySeries.A[i]===6*3600000));
});


test('independent residual diagnostics agree on one shared residual sequence',()=>{
 const residuals=Array.from({length:120},(_,i)=>.7*Math.sin(i*.37)+.2*Math.cos(i*.11)+.03*Math.sin(i*1.7));
 const model={available:true,residuals,auditDesign:{elapsedDaysBySeries:{BTC:Array(120).fill(1)}}};
 const diagnostics=diagnoseModel(model);
 const result=validateResidualDiagnostics(model,diagnostics);
 assert.equal(result.status,'BOTH_PATHS_AGREE',JSON.stringify(result.checks));
 assert.equal(result.passed,result.total);
 assert.ok(result.checks.some(c=>c.name==='Ljung–Box Q'));
});

test('independent residual audit catches incompatible Durbin–Watson and Ljung–Box values',()=>{
 const residuals=Array.from({length:1244},(_,i)=>.7*Math.sin(i*.37)+.2*Math.cos(i*.11)+.03*Math.sin(i*1.7));
 const model={available:true,residuals,auditDesign:{elapsedDaysBySeries:{BTC:Array(1244).fill(1)}}};
 const actual=diagnoseModel(model);
 const inconsistent={...actual,durbinWatson:1.137,ljungBox:{...actual.ljungBox,stat:7.5425,p:.6734},residualLag1Correlation:.4315};
 const result=validateResidualDiagnostics(model,inconsistent);
 assert.equal(result.status,'ALERT');
 assert.ok(result.checks.some(c=>c.status==='FAIL'&&c.name==='Durbin–Watson'));
 assert.ok(result.checks.some(c=>c.status==='FAIL'&&c.name==='Ljung–Box Q'));
 assert.ok(result.firstLagContributionToLjungBox>200);
});
