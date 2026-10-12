import test from 'node:test';
import assert from 'node:assert/strict';
import { breuschPagan, whiteTest, archLM, diagnoseHeteroskedasticity } from '../src/analysis/heteroskedasticity.js';

test('Breusch–Pagan detects variance systematically increasing with a predictor', () => {
  const x = Array.from({length:40},(_,i)=>i/10);
  const residuals = x.map((v,i)=>Math.sqrt(0.02+v*v)*(i%2?1:-1));
  const r = breuschPagan(residuals,[x]);
  assert.equal(r.available,true);
  assert.equal(r.df,1);
  assert.ok(r.statistic>10,JSON.stringify(r));
  assert.ok(r.pValue<0.01,JSON.stringify(r));
});

test('White test detects a nonlinear variance pattern', () => {
  const x = Array.from({length:60},(_,i)=>(i-29.5)/10);
  const residuals = x.map((v,i)=>Math.sqrt(0.02+v*v*v*v)*(i%2?1:-1));
  const r = whiteTest(residuals,[x]);
  assert.equal(r.available,true);
  assert.equal(r.df,2);
  assert.ok(r.pValue<0.05,JSON.stringify(r));
});

test('ARCH-LM detects serial dependence in squared residuals', () => {
  const residuals = [];
  let variance=0.1;
  for(let i=0;i<100;i++){
    const shock = i%2===0 ? 1 : -1;
    variance = 0.05 + 0.85*(i===0?0.1:residuals[i-1]**2);
    residuals.push(Math.sqrt(variance)*shock);
  }
  const r = archLM(residuals,1);
  assert.equal(r.available,true);
  assert.equal(r.df,1);
  assert.ok(r.pValue<0.05,JSON.stringify(r));
});

test('diagnostic wrapper keeps tests separate and reports inconclusive cases honestly', () => {
  assert.equal(breuschPagan([1,2,3],[[1,2,3]]).available,false);
  const model = {
    available:true,
    residuals:Array.from({length:40},(_,i)=>Math.sin(i*1.7)*(1+i/100)),
    auditDesign:{x:Array.from({length:40},(_,i)=>[1,i/10])}
  };
  const r = diagnoseHeteroskedasticity(model);
  assert.equal(r.available,true);
  assert.deepEqual(r.tests.map(x=>x.method),['Breusch–Pagan','White','ARCH-LM']);
  assert.ok(r.tests.every(x=>x.available===true || x.interpretation==='INCONCLUSIVE'));
  assert.ok(r.notes.some(x=>x.includes('não prova')));
});
