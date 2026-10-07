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
        api:{base:API_BASE,health,datasetsSummary:summarizeDatasets(datasets)},
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

function pickCandle(c){
  return {timestamp:c.timestamp,open:c.open,high:c.high,low:c.low,close:c.close,volume:c.volume??null};
}

function summarizeDatasets(result){
  if(!result)return null;
  if(!result.ok)return result;
  const body=result.body;
  const rows=Array.isArray(body)?body:(body?.datasets||[]);
  return {
    http:result.http,
    count:rows.length,
    datasets:rows.map(d=>({
      id:d.id,name:d.name,provider:d.provider,symbol:d.symbol,kind:d.kind,interval:d.interval,currency:d.currency,updated_at:d.updated_at
    }))
  };
}
