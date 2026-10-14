import {analyzeBtcEventWindow,formatEventStudyPct} from './btc-event-study.js';

const CPI_EVENT={
  id:'us-cpi-2026-09',
  title:'CPI dos EUA · setembro de 2026',
  timestamp:Date.parse('2026-10-14T12:30:00Z'),
  actual:{headlineYoY:3.7,consensusHeadlineYoY:3.6,headlineMoM:0.6,consensusHeadlineMoM:0.6,coreYoY:2.6,consensusCoreYoY:2.5},
  sources:[
    {label:'BLS · comunicado oficial',url:'https://www.bls.gov/news.release/archives/cpi_10142026.htm'},
    {label:'Reuters · expectativas e reação de mercado',url:'https://www.reuters.com/world/us/us-consumer-prices-accelerate-september-costlier-gasoline-core-cpi-firmer-2026-10-14/'}
  ]
};
const HOUR=3600000;
const fmtTime=ts=>Number.isFinite(ts)?new Date(ts).toLocaleString('pt-BR',{timeZone:'UTC',dateStyle:'short',timeStyle:'short'})+' UTC':'—';
const fmtPrice=value=>Number.isFinite(value)?value.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}):'—';
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function attachBtcEventStudy({dataClient,normalizeCandles}){
  const host=document.querySelector('#btc-event-study');
  const button=document.querySelector('#run-btc-event-study');
  const status=document.querySelector('#btc-event-status');
  const results=document.querySelector('#btc-event-results');
  const copy=document.querySelector('#copy-btc-event-study');
  if(!host||!button||!status||!results)return;
  let report='';
  const render=(analysis)=>{
    const e=CPI_EVENT, a=e.actual;
    const rows=[
      ['Pré-evento · T−4h → T−1h',analysis.pre?.returnPct],
      ['Pós-evento · T+1h',analysis.post?.h1?.returnPct],
      ['Pós-evento · T+4h',analysis.post?.h4?.returnPct],
      ['Pós-evento · T+24h',analysis.post?.h24?.returnPct]
    ];
    results.innerHTML='<div class="btc-event-facts"><div><span>CPI cheio · anual</span><strong>'+a.headlineYoY+'% vs '+a.consensusHeadlineYoY+'% esperado</strong><small>Surpresa: +'+(a.headlineYoY-a.consensusHeadlineYoY).toFixed(1)+' p.p.</small></div><div><span>CPI núcleo · anual</span><strong>'+a.coreYoY+'% vs '+a.consensusCoreYoY+'% esperado</strong><small>Surpresa: +'+(a.coreYoY-a.consensusCoreYoY).toFixed(1)+' p.p.</small></div><div><span>CPI cheio · mensal</span><strong>'+a.headlineMoM+'% vs '+a.consensusHeadlineMoM+'% esperado</strong><small>Sem surpresa na leitura mensal, conforme consenso citado.</small></div></div>'
      +'<div class="btc-event-metrics">'+rows.map(([label,value])=>'<div class="btc-event-metric"><span>'+label+'</span><strong class="'+(Number.isFinite(value)?(value>0?'positive':value<0?'negative':'neutral'):'')+'">'+formatEventStudyPct(value)+'</strong></div>').join('')+'</div>'
      +'<div class="btc-event-meta"><span>Referência T−1h: '+fmtPrice(analysis.baseline?.close)+' · candle '+fmtTime(analysis.baseline?.timestamp)+'</span><span>Dados: '+analysis.observations+' candles horários · última observação '+fmtTime(analysis.coverage?.end)+'</span></div>'
      +'<p class="btc-event-caveat">Este é um estudo temporal exploratório, não uma estimativa causal. A janela de 24h só aparece quando os candles já existem; o Oraculum não atualiza nem ingere dados automaticamente nesta tela.</p>';
    report=[
      'ORACULUM — ESTUDO DE EVENTO BTC',
      'Evento: '+e.title,
      'Horário oficial do evento: '+new Date(e.timestamp).toISOString(),
      'Cobertura dos candles: '+new Date(analysis.coverage.start).toISOString()+' a '+new Date(analysis.coverage.end).toISOString(),
      'Observações horárias: '+analysis.observations,
      'Referência T-1h: '+analysis.baseline.close+' em '+new Date(analysis.baseline.timestamp).toISOString(),
      ...rows.map(([label,value])=>label+': '+formatEventStudyPct(value)),
      'CPI anual: 3,7% observado vs 3,6% esperado; núcleo anual 2,6% vs 2,5%; CPI mensal 0,6% vs 0,6%.',
      ...analysis.notes,
      'Fontes: '+e.sources.map(s=>s.url).join(' | ')
    ].join('\n');
    status.textContent='ANÁLISE CALCULADA · NÃO CAUSAL';
  };
  button.addEventListener('click',async()=>{
    button.disabled=true;button.textContent='CARREGANDO BTC 1H…';status.textContent='LENDO DADOS EXISTENTES';results.innerHTML='<p class="btc-event-message">Consultando candles horários existentes. Nenhuma ingestão será disparada.</p>';
    try{
      const loaded=await dataClient.loadOrPopulate({provider:'yahoo',symbol:'BTC-USD',kind:'ohlcv',interval:'1h',currency:'USD'});
      const candles=normalizeCandles(loaded.candles||[]);
      if(!candles.length)throw new Error('O dataset BTC-USD/1h existe, mas não contém candles legíveis.');
      const analysis=analyzeBtcEventWindow(candles,CPI_EVENT.timestamp,{toleranceMs:90*60*1000});
      if(!analysis.available)throw new Error(analysis.reason);
      render(analysis);
    }catch(error){
      report='';
      status.textContent='DADOS INSUFICIENTES';
      results.innerHTML='<p class="btc-event-message">'+safe(error?.message||'Não foi possível calcular o estudo.')+'</p><p class="btc-event-caveat">Por segurança, esta rotina é somente leitura. Se o dataset horário não existir ou estiver atrasado, não haverá ingestão automática nem alteração do banco D1.</p>';
    }finally{button.disabled=false;button.textContent='RECALCULAR JANELA';}
  });
  copy?.addEventListener('click',async()=>{
    if(!report)return;
    try{await navigator.clipboard.writeText(report);copy.textContent='RELATÓRIO COPIADO ✓';}
    catch{copy.textContent='COPIE PELO RELATÓRIO';}
    setTimeout(()=>copy.textContent='COPIAR AUDITORIA',1500);
  });
  const sourceHost=host.querySelector('.btc-event-sources');
  if(sourceHost)sourceHost.innerHTML=CPI_EVENT.sources.map(s=>'<a href="'+s.url+'" target="_blank" rel="noopener">'+safe(s.label)+' ↗</a>').join('');
}
