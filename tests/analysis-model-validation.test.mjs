import test from 'node:test';
import assert from 'node:assert/strict';
import { runExplanatoryModel } from '../src/analysis/explanatory-model.js';
import { validateModelTwoWays } from '../src/analysis/model-validation.js';

test('independent model validation agrees on a deterministic sample',()=>{
 const rows=[];let a=100,b=50,c=80;const start=Date.UTC(2024,0,1),day=86400000;rows.push({timestamp:start,A:a,B:b,C:c});
 for(let i=0;i<180;i++){const ra=.0004+.012*Math.sin(i*.37)+.004*Math.cos(i*.13),rb=.0002+1.35*ra+.003*Math.sin(i*.71),rc=-.0001+.25*ra+.009*Math.cos(i*.29);a*=Math.exp(ra);b*=Math.exp(rb);c*=Math.exp(rc);rows.push({timestamp:start+(i+1)*day,A:a,B:b,C:c})}
 const model=runExplanatoryModel(rows,[{key:'A',symbol:'A'},{key:'B',symbol:'B'},{key:'C',symbol:'C'}],{returnMode:'log',hacLag:5});
 assert.equal(model.available,true);\n assert.ok(Math.abs(model.rmse-Math.sqrt(model.sse/model.observations))<1e-12,'RMSE must divide SSE by n');\n assert.ok(Math.abs(model.residualStandardError-Math.sqrt(model.sse/model.df))<1e-12,'residual standard error must divide SSE by residual degrees of freedom');\n const result=validateModelTwoWays(model);assert.equal(result.status,'BOTH_PATHS_AGREE',JSON.stringify(result.checks));assert.equal(result.passed,result.total);assert.equal(result.economicValidity,'NOT_ASSESSED');
});
test('missing model is not marked confirmed',()=>assert.equal(validateModelTwoWays({available:false}).status,'NOT_CHECKED'));
