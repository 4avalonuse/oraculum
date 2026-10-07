const API_BASE='https://oraculum-data-api.4avalonuse.workers.dev';

export function attachDiagnosticCopy({getState}){
  const button=document.querySelector('#diagnostic-copy');
  if(!button)return;

  const errors=[];
  const pushError=(type,data)=>errors.push({time:new Date().toISOString(),type,...data});

  window.addEventListener('error',event=>pushError('window.error',{
    message:event.message,source:event.filename||'',line:event.lineno||0,column:event.colno||0
  }));
  window.addEventListener('unhandledrejection',event=>pushError('unhandledrejection',{
    message:String(event.reason?.message||event.reason||'')
  }));

  button.addEventListener('click',async()=>{
    const original=button.textContent;
    button.disabled=true;
    button.textContent='COPIANDO...';

    try{
      const state=getState?.()||{};
      let health=null,datasets=null;

      try{
        const response=await fetch(API_BASE+'/api/health',{cache:'no-store'});
        health={http:response.status,ok:response.ok,body:await response.json()};
      }catch(error){
        health={ok:false,error:String(error?.message||error)};
      }

      try{
        const response=await fetch(API_BASE+'/api/datasets',{cache:'no-store'});
        datasets={http:response.status,ok:response.ok,body:await response.json()};
      }catch(error){
        datasets={ok:false,error:String(error?.message||error)};
      }

      const active=state.active||{};
      const candles=active.candles||[];
      const first=candles[0]||null;
      const last=candles.at(-1)||null;
      const quality=candles.length?{
        count:candles.length,
        firstTimestamp:first?.timestamp??null,
        lastTimestamp:last?.timestamp??null,
        first:first?pickCandle(first):null,
        last:last?pickCandle(last):null,
        invalidCount:candles.filter(c=>!Number.isFinite(c.timestamp)||!Number.isFinite(c.open)||!Number.isFinite(c.high)||!Number.isFinite(c.low)||!Number.isFinite(c.close)).length,
        nonPositivePriceCount:candles.filter(c=>!(c.close>0)).length,
        descendingTimestampCount:candles.slice(1).filter((c,i)=>c.timestamp<=candles[i].timestamp).length
      }:null;

      const payload={
        diagnostic:'ORACULUM_DIAGNOSTIC',
        version:1,
        generatedAt:new Date().toISOString(),
        page:{url:location.href,title:document.title},
        browser:{
          userAgent:navigator.userAgent,
          language:navigator.language,
          platform:navigator.platform,
          viewport:{width:innerWidth,height:innerHeight},
          devicePixelRatio:devicePixelRatio
        },
        state:{
          activeSymbol:state.activeSymbol??null,
          asset:state.asset??null,
          interval:state.activeInterval??null,
          status:document.querySelector('#status')?.textContent||null,
          source:document.querySelector('#source')?.textContent||null,
          count:document.querySelector('#count')?.textContent||null,
          analysisStatus:document.querySelector('#analysis-status')?.textContent||null,
          analysisReference:document.querySelector('#analysis-reference')?.value||null,
          selectedAnalysisAssets:[...document.querySelectorAll('.analysis-asset:checked')].map(x=>x.value),
          candles:quality
        },
        api:{base:API_BASE,health,datasetsSummary:summarizeDatasets(datasets),testBattery:await runTestBattery(datasets)},
        chart:{
          type:document.querySelector('#chart-type-toggle')?.textContent||null,
          scale:document.querySelector('#scale-toggle')?.textContent||null
        },
        errors:errors.slice(-30),
        notes:[
          'Pacote gerado pelo botão COPIAR DIAGNÓSTICO.',
          'Não inclui localStorage, cookies, tokens ou dados pessoais.',
          'Datasets da API são resumidos para reduzir o tamanho da cópia.'
        ]
      };

      const text=JSON.stringify(payload,null,2);
      await navigator.clipboard.writeText(text);
      button.textContent='COPIADO ✓';
      setTimeout(()=>{button.textContent=original;button.disabled=false},1400);
    }catch(error){
      console.error('[ORACULUM DIAGNOSTIC]',error);
      button.textContent='ERRO AO COPIAR';
      setTimeout(()=>{button.textContent=original;button.disabled=false},1800);
    }
  });
}

async function runTestBattery(datasetResult){
  const rows=summarizeDatasets(datasetResult)?.datasets||[];
  const tests=['TEST-A','TEST-B','TEST-C'];
  const out={status:'RUNNING',generatedAt:new Date().toISOString(),tests:[]};

  try{
    const catalog=rows.filter(d=>d.provider==='synthetic'&&d.kind==='ohlcv'&&d.interval==='1d');
    const bySymbol=Object.fromEntries(catalog.map(d=>[d.symbol,d]));
    const series={};

    for(const symbol of tests){
      const dataset=bySymbol[symbol];
      if(!dataset?.id){
        out.tests.push({id:symbol,status:'FAIL',reason:'Dataset 1d não encontrado no catálogo'});
        continue;
      }

      let response=await fetch(API_BASE+'/api/datasets/'+encodeURIComponent(dataset.id),{cache:'no-store'});
      let payload=null;
      try{payload=await response.json()}catch{}
      let candles=payload?.ok&&Array.isArray(payload.data)?payload.data:[];

      if(!candles.length){
        response=await fetch(API_BASE+'/api/datasets/'+encodeURIComponent(dataset.id)+'/refresh',{method:'POST',cache:'no-store'});
        try{payload=await response.json()}catch{}
        candles=payload?.ok&&Array.isArray(payload.data)?payload.data:[];
      }

      series[symbol]=candles;
      const returns=logReturns(candles);
      out.tests.push({
        id:symbol,
        datasetId:dataset.id,
        candles:candles.length,
        returns:returns.length,
        status:candles.length>=20?'PASS':'FAIL'
      });
    }

    const a=series['TEST-A']||[];
    const b=series['TEST-B']||[];
    const c=series['TEST-C']||[];
    const ra=logReturns(a);
    const rb=logReturns(b);
    const rc=logReturns(c);

    const meanA=mean(ra);
    const betaAB=regressionBeta(ra,rb);
    const ac1C=autocorrelation(rc,1);

    const checks=[
      {
        id:'TEST-A.mean-return',
        expected:'média do retorno log > 0',
        observed:meanA,
        status:Number.isFinite(meanA)&&meanA>0?'PASS':'FAIL'
      },
      {
        id:'TEST-B.beta-vs-A',
        expected:'beta ≈ 2.00',
        observed:betaAB,
        tolerance:'[1.90, 2.10]',
        status:Number.isFinite(betaAB)&&betaAB>=1.90&&betaAB<=2.10?'PASS':'FAIL'
      },
      {
        id:'TEST-C.autocorrelation',
        expected:'autocorrelação lag 1 > 0.20',
        observed:ac1C,
        status:Number.isFinite(ac1C)&&ac1C>0.20?'PASS':'FAIL'
      }
    ];

    out.checks=checks;
    out.summary={
      passed:out.tests.filter(t=>t.status==='PASS').length+checks.filter(t=>t.status==='PASS').length,
      failed:out.tests.filter(t=>t.status==='FAIL').length+checks.filter(t=>t.status==='FAIL').length,
      total:out.tests.length+checks.length
    };
    out.status=out.summary.failed===0?'PASS':'FAIL';
  }catch(error){
    out.status='FAIL';
    out.error=String(error?.message||error);
  }
  return out;
}

function logReturns(candles){
  const out=[];
  for(let i=1;i<candles.length;i++){
    const a=Number(candles[i-1]?.close);
    const b=Number(candles[i]?.close);
    if(a>0&&b>0&&Number.isFinite(a)&&Number.isFinite(b))out.push(Math.log(b/a));
  }
  return out;
}

function mean(values){
  return values.length?values.reduce((s,v)=>s+v,0)/values.length:NaN;
}

function regressionBeta(x,y){
  const n=Math.min(x.length,y.length);
  if(n<2)return NaN;
  const xx=x.slice(0,n), yy=y.slice(0,n);
  const mx=mean(xx), my=mean(yy);
  let cov=0,varx=0;
  for(let i=0;i<n;i++){
    const dx=xx[i]-mx;
    cov+=dx*(yy[i]-my);
    varx+=dx*dx;
  }
  return varx?cov/varx:NaN;
}

function autocorrelation(values,lag=1){
  if(values.length<=lag+1)return NaN;
  const m=mean(values);
  let num=0,den=0;
  for(let i=0;i<values.length;i++)den+=(values[i]-m)**2;
  for(let i=lag;i<values.length;i++)num+=(values[i]-m)*(values[i-lag]-m);
  return den?num/den:NaN;
}

function pickCandle(c){
  return {timestamp:c.timestamp,open:c.open,high:c.high,low:c.low,close:c.close,volume:c.volume??null};
}

function summarizeDatasets(result){
  if(!result)return null;
  if(!result.ok)return result;
  const body=result.body;
  const rows=Array.isArray(body)?body:(body?.data||body?.datasets||[]);
  return {
    http:result.http,
    count:rows.length,
    datasets:rows.map(d=>({
      id:d.id,name:d.name,provider:d.provider,symbol:d.symbol,kind:d.kind,interval:d.interval,currency:d.currency,updated_at:d.updated_at
    }))
  };
}
