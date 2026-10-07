const API_BASE='https://oraculum-data-api.4avalonuse.workers.dev';

export function attachDiagnosticCopy(){
  const button=document.querySelector('#test-battery');
  const panel=document.querySelector('#test-battery-panel');
  const resultsEl=document.querySelector('#test-battery-results');
  const summaryEl=document.querySelector('#test-battery-summary');
  const copyButton=document.querySelector('#test-battery-copy');
  const closeButton=document.querySelector('#test-battery-close');
  if(!button||!panel||!resultsEl)return;

  let lastResult=null;

  closeButton?.addEventListener('click',()=>panel.classList.remove('open'));

  copyButton?.addEventListener('click',async()=>{
    if(!lastResult)return;
    const text=compactText(lastResult);
    try{
      await navigator.clipboard.writeText(text);
      copyButton.textContent='COPIADO ✓';
      setTimeout(()=>copyButton.textContent='COPIAR RESULTADO',1200);
    }catch{
      copyButton.textContent='COPIE MANUALMENTE';
      setTimeout(()=>copyButton.textContent='COPIAR RESULTADO',1600);
    }
  });

  button.addEventListener('click',async()=>{
    const original=button.textContent;
    button.disabled=true;
    button.textContent='TESTANDO...';
    panel.classList.add('open');
    summaryEl.textContent='Atualizando os três datasets controlados...';
    resultsEl.innerHTML='<div class="battery-loading">Executando bateria sobre os dados reais da API…</div>';

    try{
      lastResult=await runTestBattery();
      renderBattery(lastResult,{resultsEl,summaryEl});
      button.textContent=lastResult.status==='PASS'?'TESTES ✓':'TESTES — FALHA';
    }catch(error){
      lastResult={status:'FAIL',summary:{passed:0,failed:1,total:1},error:String(error?.message||error),tests:[],checks:[]};
      renderBattery(lastResult,{resultsEl,summaryEl});
      button.textContent='TESTES — FALHA';
    }finally{
      setTimeout(()=>{button.textContent=original;button.disabled=false},1800);
    }
  });
}

async function runTestBattery(){
  const catalogResponse=await fetch(API_BASE+'/api/datasets',{cache:'no-store'});
  const catalogBody=await catalogResponse.json();
  if(!catalogResponse.ok)throw new Error(catalogBody?.error||'Falha ao consultar catálogo');
  const rows=Array.isArray(catalogBody)?catalogBody:(catalogBody?.data||catalogBody?.datasets||[]);
  const bySymbol=Object.fromEntries(
    rows.filter(d=>d.provider==='synthetic'&&d.kind==='ohlcv'&&d.interval==='1d').map(d=>[d.symbol,d])
  );

  const series={};
  const tests=[];
  for(const symbol of ['TEST-A','TEST-B','TEST-C']){
    const dataset=bySymbol[symbol];
    if(!dataset?.id){
      tests.push({id:symbol,status:'FAIL',reason:'Dataset 1d não encontrado'});
      continue;
    }

    // Fixtures controladas são sempre regeneradas para que a bateria valide o gerador atual.
    const refresh=await fetch(API_BASE+'/api/datasets/'+encodeURIComponent(dataset.id)+'/refresh',{
      method:'POST',cache:'no-store'
    });
    const body=await refresh.json();
    const candles=extractCandles(body);
    series[symbol]=candles;

    const quality=qualityCheck(candles);
    tests.push({id:symbol,status:quality.status,candles:candles.length,returns:Math.max(0,candles.length-1),quality});
  }

  const ra=logReturns(series['TEST-A']||[]);
  const rb=logReturns(series['TEST-B']||[]);
  const rc=logReturns(series['TEST-C']||[]);

  const meanA=mean(ra);
  const betaAB=regressionBeta(ra,rb);
  const ac1C=autocorrelation(rc,1);

  const checks=[
    {id:'TEST-A.mean-return',label:'TEST-A · crescimento',expected:'média do retorno log > 0',observed:meanA,display:formatNumber(meanA),status:Number.isFinite(meanA)&&meanA>0?'PASS':'FAIL'},
    {id:'TEST-B.beta-vs-A',label:'TEST-B · beta',expected:'beta ≈ 2.00 · tolerância 1.90–2.10',observed:betaAB,display:formatNumber(betaAB),status:Number.isFinite(betaAB)&&betaAB>=1.90&&betaAB<=2.10?'PASS':'FAIL'},
    {id:'TEST-C.autocorrelation',label:'TEST-C · autocorrelação',expected:'lag 1 > 0.20',observed:ac1C,display:formatNumber(ac1C),status:Number.isFinite(ac1C)&&ac1C>0.20?'PASS':'FAIL'}
  ];

  const passed=tests.filter(x=>x.status==='PASS').length+checks.filter(x=>x.status==='PASS').length;
  const failed=tests.filter(x=>x.status==='FAIL').length+checks.filter(x=>x.status==='FAIL').length;
  return {
    status:failed===0?'PASS':'FAIL',
    generatedAt:new Date().toISOString(),
    summary:{passed,failed,total:passed+failed},
    tests,
    checks
  };
}

function extractCandles(body){
  const candidates=[body?.data,body?.data?.candles,body?.data?.rows,body?.candles,body?.rows,body?.result,body?.result?.candles,body?.result?.rows];
  for(const value of candidates){
    if(Array.isArray(value))return normalizeBatteryCandles(value);
  }
  return [];
}

function normalizeBatteryCandles(values){
  return values.map(c=>({
    timestamp:Number(c?.timestamp??c?.ts??c?.time??c?.date??NaN),
    open:Number(c?.open??c?.o??NaN),
    high:Number(c?.high??c?.h??NaN),
    low:Number(c?.low??c?.l??NaN),
    close:Number(c?.close??c?.c??NaN)
  })).filter(c=>Number.isFinite(c.timestamp)&&Number.isFinite(c.close));
}

function qualityCheck(candles){
  const valid=candles.filter(c=>Number.isFinite(Number(c.timestamp))&&Number.isFinite(Number(c.open))&&Number.isFinite(Number(c.high))&&Number.isFinite(Number(c.low))&&Number.isFinite(Number(c.close))&&Number(c.close)>0);
  const descending=candles.slice(1).filter((c,i)=>Number(c.timestamp)<=Number(candles[i].timestamp)).length;
  const ok=candles.length>=20&&valid.length===candles.length&&descending===0;
  return {status:ok?'PASS':'FAIL',valid:valid.length,invalid:candles.length-valid.length,descending};
}

function renderBattery(result,{resultsEl,summaryEl}){
  const total=result.summary?.total||0;
  const passed=result.summary?.passed||0;
  summaryEl.textContent=result.status==='PASS'
    ? `${passed}/${total} PASS · fixtures regeneradas pela API`
    : `${passed}/${total} PASS · revisão necessária`;

  const testRows=(result.tests||[]).map(t=>{
    const q=t.quality;
    const detail=q
      ? `${t.candles} candles · ${t.returns} retornos · válidos ${q.valid}/${t.candles}`
      : (t.reason||'sem dados');
    return rowHtml(t.id,t.status,detail);
  }).join('');

  const checkRows=(result.checks||[]).map(c=>
    rowHtml(c.label,c.status,`observado ${c.display} · esperado ${c.expected}`)
  ).join('');

  resultsEl.innerHTML=`
    <div class="battery-group">
      <div class="battery-label">INTEGRIDADE DOS DADOS</div>
      ${testRows}
    </div>
    <div class="battery-group">
      <div class="battery-label">PROPRIEDADES CONTROLADAS</div>
      ${checkRows}
    </div>
    ${result.error?'<div class="battery-error">'+escapeHtml(result.error)+'</div>':''}
  `;
}

function rowHtml(label,status,detail){
  return `<div class="battery-row"><span class="battery-state ${status==='PASS'?'pass':'fail'}">${status==='PASS'?'✓':'!'}</span><div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></div></div>`;
}

function compactText(result){
  const lines=[
    'ORACULUM · BATERIA DE TESTES',
    `STATUS: ${result.status} · ${result.summary?.passed||0}/${result.summary?.total||0}`,
    ...(result.checks||[]).map(c=>`${c.id}: ${c.status} | observado=${c.display} | esperado=${c.expected}`)
  ];
  return lines.join('\\n');
}

function logReturns(candles){
  const out=[];
  for(let i=1;i<candles.length;i++){
    const a=Number(candles[i-1]?.close),b=Number(candles[i]?.close);
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
  const mx=mean(x.slice(0,n)),my=mean(y.slice(0,n));
  let cov=0,varx=0;
  for(let i=0;i<n;i++){
    const dx=x[i]-mx;
    cov+=dx*(y[i]-my);
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

function formatNumber(value){
  return Number.isFinite(value)?value.toFixed(4):'—';
}

function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
