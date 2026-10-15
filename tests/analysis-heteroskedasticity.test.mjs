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

test('constant squared residuals return no evidence rather than an unavailable test', () => {
  const x = Array.from({length:30},(_,i)=>i);
  const residuals = x.map((_,i)=>i%2===0?1:-1);
  const bp = breuschPagan(residuals,[x]);
  const white = whiteTest(residuals,[x]);
  assert.equal(bp.available,true,JSON.stringify(bp));
  assert.equal(white.available,true,JSON.stringify(white));
  assert.equal(bp.statistic,0);
  assert.equal(white.statistic,0);
  assert.equal(bp.pValue,1);
  assert.equal(white.pValue,1);
  assert.equal(bp.interpretation,'NO_STRONG_EVIDENCE_AGAINST_NULL');
});

test('heteroskedasticity tests match independent reference fixtures', () => {
  // Reference values precomputed with statsmodels.stats.diagnostic:
  // het_breuschpagan(residuals, add_constant(x)),
  // het_white(residuals, add_constant(x)), het_arch(residuals, nlags=2).
  // This is an external numerical fixture, not a second copy of the production formulas.
  const x = Array.from({length:20},(_,i)=>(i-9.5)/5);
  const residuals = x.map((_,i)=>(i%2===0?1:-1)*(0.2+0.03*i+0.07*(i%4)));
  const bp = breuschPagan(residuals,[x]);
  const white = whiteTest(residuals,[x]);
  const arch = archLM(residuals,2);
  const close = (actual, expected, tolerance=1e-6) => assert.ok(
    Math.abs(actual-expected) <= tolerance*Math.max(1,Math.abs(expected)),
    `expected ${expected}, got ${actual}`
  );
  assert.equal(bp.df,1);
  close(bp.statistic,16.535634295094184);
  close(bp.pValue,4.7744320741398e-5);
  assert.equal(white.df,2);
  close(white.statistic,17.0279877529215);
  close(white.pValue,0.0002006408876451547);
  assert.equal(arch.df,2);
  assert.equal(arch.lag,2);
  close(arch.statistic,11.442163033912015);
  close(arch.pValue,0.0032761657568049466);
});

test('variance diagnostics are invariant to harmless predictor rescaling', () => {
  const x = Array.from({length:40},(_,i)=>(i-19.5)/10);
  const smallX = x.map(v=>v*1e-3);
  const residuals = x.map((_,i)=>(i%2===0?1:-1)*(0.2+0.03*i+0.07*(i%4)));
  const close = (a,b) => assert.ok(
    Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a-b) <= 1e-7*Math.max(1,Math.abs(a),Math.abs(b)),
    `expected scale-invariant results; got ${a} and ${b}`
  );
  for (const run of [breuschPagan,whiteTest]) {
    const ordinary = run(residuals,[x]);
    const scaled = run(residuals,[smallX]);
    assert.equal(ordinary.available,true,JSON.stringify(ordinary));
    assert.equal(scaled.available,true,JSON.stringify(scaled));
    assert.equal(scaled.df,ordinary.df);
    close(scaled.statistic,ordinary.statistic);
    close(scaled.pValue,ordinary.pValue);
  }
});

test('effective degrees of freedom account for redundant predictors and White terms', () => {
  const x = Array.from({length:40},(_,i)=>(i-19.5)/10);
  const residuals = x.map((_,i)=>(i%2===0?1:-1)*(0.2+0.03*i+0.07*(i%4)));
  const bpSingle = breuschPagan(residuals,[x]);
  const bpRedundant = breuschPagan(residuals,[x,x.map(v=>2*v)]);
  const whiteSingle = whiteTest(residuals,[x]);
  const whiteRedundant = whiteTest(residuals,[x,x.map(v=>2*v)]);
  assert.equal(bpRedundant.available,true,JSON.stringify(bpRedundant));
  assert.equal(bpRedundant.df,1);
  assert.equal(whiteRedundant.available,true,JSON.stringify(whiteRedundant));
  assert.equal(whiteRedundant.df,2);
  assert.ok(Math.abs(bpSingle.statistic-bpRedundant.statistic)<1e-7);
  assert.ok(Math.abs(whiteSingle.statistic-whiteRedundant.statistic)<1e-7);
});

test('edge cases are explicit: nonfinite data and unidentifiable ARCH lags', () => {
  assert.equal(breuschPagan([1,NaN,2,3,4,5,6,7,8,9,10,11],[[1,2,3,4,5,6,7,8,9,10,11,12]]).available,false);
  assert.equal(whiteTest(Array(20).fill(1),[Array.from({length:20},(_,i)=>i)]).available,true);
  const arch = archLM(Array.from({length:30},(_,i)=>i%2===0?1:-1),2);
  assert.equal(arch.available,false,JSON.stringify(arch));
});

test('real Oraculum model pipeline passes calculated residuals into variance interpretation', async () => {
  const { runExplanatoryModel } = await import('../src/analysis/explanatory-model.js');
  const { diagnoseModel } = await import('../src/analysis/model-diagnostics.js');
  const start = Date.UTC(2024,0,1), day = 86400000;
  const rows = [{timestamp:start,BTC:100,SOL:100}];
  let btc=100,sol=100;
  for(let i=0;i<180;i++){
    const x = 0.018*Math.sin(i*0.37) + 0.009*Math.cos(i*0.13);
    const hetero = 0.001 + 0.06*Math.abs(x) + (i%9===0?0.012:0);
    const error = (i%2===0?1:-1)*hetero;
    sol *= Math.exp(x);
    btc *= Math.exp(0.0002 + 1.25*x + error);
    rows.push({timestamp:start+(i+1)*day,BTC:btc,SOL:sol});
  }
  const series = [{key:'BTC',symbol:'BTC',category:'crypto'},{key:'SOL',symbol:'SOL',category:'crypto'}];
  const model = runExplanatoryModel(rows,series,{hacLag:3});
  assert.equal(model.available,true,model.reason);
  assert.equal(model.observations,180);
  assert.equal(model.residuals.length,180);
  const diagnostics = diagnoseModel(model);
  assert.equal(diagnostics.available,true);
  assert.equal(diagnostics.heteroskedasticity.available,true);
  assert.deepEqual(diagnostics.heteroskedasticity.tests.map(t=>t.method),['Breusch–Pagan','White','ARCH-LM']);
  assert.ok(diagnostics.heteroskedasticity.tests.some(t=>t.available && Number.isFinite(t.pValue)));
  const { buildHeteroskedasticityReading } = await import('../src/analysis/heteroskedasticity-reading.js');
  const html = buildHeteroskedasticityReading({heteroskedasticity:diagnostics.heteroskedasticity},{fmt:v=>String(v)});
  assert.match(html,/Interpretação dos resultados calculados/);
  assert.match(html,/Próximo passo sugerido/);
});

test('scientific reading does not label invalid p-values as non-significant', async () => {
  const { buildHeteroskedasticityReading } = await import('../src/analysis/heteroskedasticity-reading.js');
  const html = buildHeteroskedasticityReading({heteroskedasticity:{
    alpha:0.05,tests:[{method:'White',available:true,statistic:3,df:2,pValue:NaN,n:30}]
  }},{fmt:v=>String(v)});
  assert.match(html,/INCONCLUSIVO/);
  assert.match(html,/valor-p não disponível ou inválido/);
  assert.doesNotMatch(html,/não rejeita sua hipótese nula ao nível/);
});
