import test from 'node:test';
import assert from 'node:assert/strict';
import {mean,std,cov,corr,returns,drawdown,regression,annualPeriods,quantile,alignSeries} from '../src/analysis/engine.js';

const near=(actual,expected,tol=1e-10)=>assert.ok(Math.abs(actual-expected)<=tol,`expected ${actual} ≈ ${expected}`);

test('empty and invalid samples are not reported as zero',()=>{
  assert.ok(Number.isNaN(mean([])));
  assert.ok(Number.isNaN(std([4])));
  assert.ok(Number.isNaN(cov([1],[2])));
  assert.ok(Number.isNaN(corr([1,1,1],[2,3,4])));
  assert.ok(Number.isNaN(corr([],[])));
  assert.ok(Number.isNaN(quantile([],0.5)));
});
test('sample mean, sample deviation, covariance and correlation match reference values',()=>{
  near(mean([1,2,3]),2);
  near(std([1,2,3]),1);
  near(cov([1,2,3],[2,4,6]),2);
  near(corr([1,2,3],[2,4,6]),1);
  near(corr([1,2,3],[6,4,2]),-1);
});
test('bivariate calculations reject unequal lengths and use paired finite observations',()=>{
  assert.ok(Number.isNaN(cov([1,2],[1,2,3])));
  near(corr([1,2,NaN,4],[2,4,100,8]),1);
});
test('returns reject non-positive and non-finite adjacent prices without fabricating values',()=>{
  const r=returns([100,110,0,121,NaN,133.1]);
  assert.equal(r.length,1);
  near(r[0],Math.log(1.1));
  near(returns([100,110],'simple')[0],0.1);
});
test('drawdown distinguishes recovered and unrecovered peak-to-trough losses',()=>{
  const recovered=drawdown([100,120,90,120,130]);
  near(recovered.max,-0.25);
  assert.equal(recovered.recovery,2);
  assert.equal(recovered.troughIndex,2);
  const unrecovered=drawdown([100,120,90,100]);
  assert.equal(unrecovered.recovery,null);
  assert.ok(Number.isNaN(drawdown([]).max));
});
test('OLS regression returns slope, intercept and R-squared',()=>{
  const r=regression([1,2,3],[3,5,7]);
  near(r.beta,2);near(r.alpha,1);near(r.r2,1);assert.equal(r.n,3);
  assert.ok(Number.isNaN(regression([1,1,1],[2,3,4]).beta));
});
test('annualization conventions are explicit by interval',()=>{
  assert.equal(annualPeriods('1h'),8760);
  assert.equal(annualPeriods('1d'),365);
  assert.equal(annualPeriods('1w'),52);
  assert.equal(annualPeriods('1M'),12);
});
test('alignment keeps only shared UTC calendar buckets and handles duplicates',()=>{
  const day=86400000, t=Date.UTC(2024,0,1);
  const rows=alignSeries([
    {key:'A',candles:[{timestamp:t,close:10},{timestamp:t+day,close:11},{timestamp:t+day+1000,close:12},{timestamp:t+2*day,close:13}]},
    {key:'B',candles:[{timestamp:t+5000,close:20},{timestamp:t+2*day,close:22}]}
  ],'1d');
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(r=>[r.A,r.B]),[[10,20],[13,22]]);
});
