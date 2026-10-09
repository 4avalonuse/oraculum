import test from 'node:test';
import assert from 'node:assert/strict';
import {mean,std,cov,corr,returns,drawdown,regression,annualPeriods,quantile,alignSeries,analyzeSeries} from '../src/analysis/engine.js';
import {runExplanatoryModel} from '../src/analysis/explanatory-model.js';

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
  assert.equal(recovered.recovery,1);
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
  assert.equal(annualPeriods('1d','trading'),252);
  assert.equal(annualPeriods('1h','trading'),1638);
});
test('alignment keeps only shared UTC calendar buckets and handles duplicates',()=>{
  const day=86400000, t=Date.UTC(2024,0,1);
  const rows=alignSeries([
    {key:'A',candles:[{timestamp:t,close:10},{timestamp:t+day,close:11},{timestamp:t+1000,close:12},{timestamp:t+2*day,close:13}]},
    {key:'B',candles:[{timestamp:t+5000,close:20},{timestamp:t+2*day,close:22}]}
  ],'1d');
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(r=>[r.A,r.B]),[[12,20],[13,22]]);
});

test('cross-asset returns use the same shared observation horizon',()=>{
  const day=86400000,t=Date.UTC(2024,0,5);
  const crypto={key:'BTC',symbol:'BTC',category:'crypto',candles:[
    {timestamp:t,close:100},{timestamp:t+day,close:110},{timestamp:t+2*day,close:121},{timestamp:t+3*day,close:133.1}
  ]};
  const stock={key:'STOCK',symbol:'STOCK',category:'stock',candles:[
    {timestamp:t,close:50},{timestamp:t+3*day,close:55}
  ]};
  const rows=alignSeries([crypto,stock],'1d');
  assert.equal(rows.length,2);
  near(rows[1].BTC,133.1);
  const result=analyzeSeries(rows,[{key:'BTC',symbol:'BTC',category:'crypto'},{key:'STOCK',symbol:'STOCK',category:'stock'}],'1d');
  near(result.series.BTC.returns[1],Math.log(133.1/100));
  near(result.series.STOCK.returns[1],Math.log(55/50));
});
test('analysis pipeline recovers known beta on aligned return observations',()=>{
  const day=86400000,t=Date.UTC(2024,0,1),x=[.01,-.02,.03,-.01,.02,.015,-.025,.005,.012,-.008,.02,-.015];
  let a=100,b=50;
  const rows=[{timestamp:t,A:a,B:b}];
  for(let i=0;i<x.length;i++){a*=Math.exp(x[i]);b*=Math.exp(.001+2*x[i]);rows.push({timestamp:t+(i+1)*day,A:a,B:b})}
  const result=analyzeSeries(rows,[{key:'A',symbol:'A',category:'crypto'},{key:'B',symbol:'B',category:'crypto'}],'1d');
  near(result.relations[0].beta,2,1e-8);
  near(result.relations[0].correlation,1,1e-8);
  near(result.relations[0].r2,1,1e-8);
});

test('multivariate model uses native aligned returns and drops only incomplete rows',()=>{
  const day=86400000,start=Date.UTC(2024,0,1),cryptoCandles=[],stockCandles=[];
  let crypto=100,stock=50;
  for(let i=0;i<45;i++){
    const timestamp=start+i*day;
    const r=[.008,-.012,.017,-.004,.011,-.019,.006][i%7];
    crypto*=Math.exp(r);
    cryptoCandles.push({timestamp,close:crypto});
    const weekday=new Date(timestamp).getUTCDay();
    if(weekday!==0&&weekday!==6){
      const sr=[.004,-.007,.012,-.003,.009][i%5];
      stock*=Math.exp(sr);
      stockCandles.push({timestamp,close:stock});
    }
  }
  const series=[{key:'BTC',symbol:'BTC',category:'crypto',candles:cryptoCandles},{key:'STOCK',symbol:'STOCK',category:'stock',candles:stockCandles}];
  const rows=alignSeries(series,'1d');
  const model=runExplanatoryModel(rows,series);
  assert.equal(model.available,true,model.reason);
  assert.equal(model.observations,rows.length-1);
  assert.ok(model.coefficients.every(c=>Number.isFinite(c.beta)));
});

test('drawdown indices refer to original observations when invalid values are skipped',()=>{
  const r=drawdown([100,NaN,120,90,120]);
  near(r.max,-0.25);
  assert.equal(r.peakIndex,2);
  assert.equal(r.troughIndex,3);
  assert.equal(r.recovery,1);
});
test('constant samples have undefined skewness, kurtosis and Jarque-Bera',async()=>{
  const {describe,jarqueBera}=await import('../src/analysis/descriptive.js');
  const d=describe(Array(12).fill(5));
  assert.ok(Number.isNaN(d.skewness));
  assert.ok(Number.isNaN(d.excessKurtosis));
  assert.ok(Number.isNaN(jarqueBera(Array(12).fill(5)).stat));
  assert.ok(Number.isNaN(jarqueBera(Array(12).fill(5)).p));
});

test('multivariate model refuses a constant dependent return series',()=>{
  const day=86400000,start=Date.UTC(2024,0,1),rows=[];
  let b=50;
  for(let i=0;i<35;i++){
    b*=Math.exp(i%2===0?.01:-.006);
    rows.push({timestamp:start+i*day,A:100,B:b});
  }
  const model=runExplanatoryModel(rows,[{key:'A',symbol:'A'},{key:'B',symbol:'B'}]);
  assert.equal(model.available,false);
  assert.match(model.reason,/variação insuficiente/);
});

test('OLS inference matches an independent numerical reference fixture',()=>{
  const x=[.01,-.02,.03,-.01,.02,.015,-.025,.005,.012,-.008,.02,-.015,.006,-.004,.018,-.011,.009,-.019,.014,.003,.016,-.006,.022,-.013];
  const e=[.001,-.001,.002,-.002,.0015,-.0015,.0005,-.0005,.0012,-.0012,.0018,-.0018,.0007,-.0007,.0011,-.0011,.0016,-.0016,.0009,-.0009,.0013,-.0013,.0004,-.0004];
  let a=100,b=50;
  const rows=[{timestamp:Date.UTC(2024,0,1),A:a,B:b}];
  for(let i=0;i<x.length;i++){
    a*=Math.exp(x[i]);
    b*=Math.exp(.0005+1.4*x[i]+e[i]);
    rows.push({timestamp:Date.UTC(2024,0,1)+(i+1)*86400000,A:a,B:b});
  }
  const model=runExplanatoryModel(rows,[{key:'B',symbol:'B'},{key:'A',symbol:'A'}],{hacLag:0});
  assert.equal(model.available,true,model.reason);
  assert.equal(model.observations,24);
  near(model.coefficients[0].beta,0.000329705154,1e-10);
  near(model.coefficients[1].beta,1.45923299,1e-7);
  near(model.r2,0.99838773212,1e-10);
  near(model.coefficients[1].se,0.01250208,1e-7);
  near(model.coefficients[1].ciLow,1.43330526,1e-7);
  near(model.coefficients[1].ciHigh,1.48516072,1e-7);
  near(model.hacCoefficients[0].hacSe,0.00020182,1e-7);
  near(model.hacCoefficients[1].hacSe,0.01443358,1e-7);
  assert.ok(model.coefficients[1].p<1e-20);
  assert.ok(model.hacCoefficients[1].hacP<1e-20);
  assert.equal(model.hacLag,0);
});
test('HAC lag is safely bounded when caller supplies invalid input',()=>{
  const x=[.01,-.02,.03,-.01,.02,.015,-.025,.005,.012,-.008,.02,-.015,.006,-.004,.018,-.011,.009,-.019,.014,.003,.016,-.006,.022,-.013];
  let a=100,b=50;
  const rows=[{timestamp:Date.UTC(2024,0,1),A:a,B:b}];
  for(let i=0;i<x.length;i++){
    a*=Math.exp(x[i]);b*=Math.exp(.001+1.3*x[i]+(i%2?.001:-.001));
    rows.push({timestamp:Date.UTC(2024,0,1)+(i+1)*86400000,A:a,B:b});
  }
  const model=runExplanatoryModel(rows,[{key:'B',symbol:'B'},{key:'A',symbol:'A'}],{hacLag:NaN});
  assert.equal(model.available,true,model.reason);
  assert.ok(Number.isInteger(model.hacLag));
  assert.ok(model.hacLag>=0&&model.hacLag<model.observations);
  assert.ok(model.hacCoefficients.every(c=>Number.isFinite(c.hacSe)));
});
