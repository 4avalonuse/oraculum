/* ORACULUM — análise investigativa sob demanda */
import {analyzeSeries,alignSeries} from './engine.js';
import {openInfo} from './explanations.js';
import {openDataTable} from './data-table.js';
import {openModal} from './analysis-modal.js';
import {wireMetricHelp} from './metric-help.js';
import {runExplanatoryModel} from './explanatory-model.js';
import {diagnoseModel} from './model-diagnostics.js';

function fmt(v,d=2){if(!Number.isFinite(v))return '—';return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d}).format(v)}
function pct(v,d=2){return Number.isFinite(v)?fmt(v*100,d)+'%':'—'}
function date(v){return Number.isFinite(Number(v))?new Date(Number(v)).toLocaleDateString('pt-BR'):'—'}
function metric(label,value,note='',help=''){return '<div class="analysis-metric"><div class="metric-label"><span>'+label+'</span><button class="metric-help" type="button" data-topic="'+label.replace(/"/g,'&quot;')+'" aria-label="Explicar '+label+'">?</button></div><strong>'+value+'</strong>'+(note?'<small>'+note+'</small>':'')+'</div>'}
function statBlock(title,items){return '<section class="analysis-stat-block"><h3>'+title+'</h3><div class="results-grid">'+items.join('')+'</div></section>'}

export function attachComparisonAnalysis({dataClient,normalizeCandles,getCandles,getInterval,getActiveSymbol,assets}){
 const $=s=>document.querySelector(s),state={rows:null,result:null,selected:[],series:[],markers:{start:0,base:0,end:0}};
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const markerDate=(rows,i)=>rows[i]?date(rows[i].timestamp):'—';

 const recomputeSample=()=>{
   if(!state.rows?.length||!state.series?.length)return;
   const start=state.markers.start,end=state.markers.end;
   const sample=state.rows.slice(start,end+1);
   if(sample.length<10)return;
   const returnMode=document.querySelector('#analysis-return')?.value||'log';
   const rollingWindow=Number(document.querySelector('#analysis-window')?.value||30);
   const result=analyzeSeries(sample,state.series,getInterval()||'1d',{returnMode,rollingWindow});
   result.explanatoryModel=runExplanatoryModel(sample,state.series,{returnMode});
   result.modelDiagnostics=diagnoseModel(result.explanatoryModel);
   result.rowsStart=sample[0].timestamp;result.rowsEnd=sample.at(-1).timestamp;
   result.periodDays=(result.rowsEnd-result.rowsStart)/86400000;
   state.result=result;
   render(result,state.series);
 };

 const renderMarkerTimeline=()=>{
   const host=$('#comparison-timeline');if(!host||!state.rows?.length)return;
   const max=Math.max(1,state.rows.length-1),m=state.markers;
   const make=(key,label,cls)=>'<button class="cmp-marker '+cls+'" data-marker="'+key+'" style="left:'+((m[key]/max)*100)+'%" aria-label="'+label+' '+markerDate(state.rows,m[key])+'"><span>'+label+'</span><b>'+markerDate(state.rows,m[key])+'</b></button>';
   host.innerHTML='<div class="cmp-timeline-track"></div>'+make('start','INÍCIO','marker-start')+make('base','BASE 100','marker-base')+make('end','FIM','marker-end');
   host.querySelectorAll('.cmp-marker').forEach(btn=>{btn.addEventListener('pointerdown',e=>{e.preventDefault();const key=btn.dataset.marker;btn.setPointerCapture?.(e.pointerId);const move=ev=>{const rect=host.getBoundingClientRect(),x=clamp(ev.clientX-rect.left,0,rect.width),idx=Math.round((x/rect.width)*max);const min=key==='base'?m.start:key==='end'?m.base:0,maxAllowed=key==='start'?m.base:key==='base'?m.end:max;m[key]=clamp(idx,min,maxAllowed);renderMarkerTimeline();renderChart(state.rows,state.series);const fresh=document.querySelector('#comparison-timeline .cmp-marker[data-marker="'+key+'"]');fresh?.setPointerCapture?.(ev.pointerId)};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);recomputeSample()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up)})});
 };

 const renderChart=(rows,series)=>{
   const host=$('#comparison-chart');if(!host||!rows.length)return;
   const w=Math.max(320,host.clientWidth||800),h=280,p={l:48,r:18,t:18,b:32};
   const start=state.markers.start,base=state.markers.base,end=state.markers.end,view=rows.slice(start,end+1),baseRow=rows[base]||view[0];
   const normalized=series.map(s=>view.map(r=>100*r[s.key]/baseRow[s.key]));
   const all=normalized.flat(),lo=Math.log(Math.min(...all)),hi=Math.log(Math.max(...all));
   const t0=view[0]?.timestamp??0,t1=view.at(-1)?.timestamp??t0,span=Math.max(1,t1-t0);
   const line=vals=>vals.map((v,i)=>{const ts=view[i]?.timestamp??t0,x=p.l+((ts-t0)/span)*(w-p.l-p.r),y=h-p.b-(Math.log(Math.max(.0001,v))-lo)/(hi-lo||1)*(h-p.t-p.b);return x.toFixed(2)+','+y.toFixed(2)}).join(' ');
   const polylines=normalized.map((v,i)=>'<polyline points="'+line(v)+'" class="cmp-line cmp-'+i+'"/>').join('');
   host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="Comparação em base 100 e escala logarítmica"><line x1="'+p.l+'" x2="'+p.l+'" y1="'+p.t+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h-p.b)+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h/2)+'" y2="'+(h/2)+'" class="cmp-grid"/>'+polylines+'<text x="'+p.l+'" y="'+(h-8)+'">'+date(view[0].timestamp)+'</text><text x="'+(w-p.r)+'" y="'+(h-8)+'" text-anchor="end">'+date(view.at(-1).timestamp)+'</text><text x="'+(p.l+6)+'" y="'+(h/2-6)+'">100 = '+date(baseRow.timestamp)+'</text></svg>';
   const legend=$('#comparison-legend');if(legend)legend.innerHTML=series.map((s,i)=>'<span><i class="legend-'+i+'"></i>'+s.symbol+'</span>').join('');
 };

 const renderContext=(result,series)=>{
   const primary=series[0],targets=series.slice(1).map(s=>s.symbol).join(' + ')||'nenhum alvo selecionado';
   $('#analysis-context').innerHTML='<div class="context-row"><div><span>REFERÊNCIA</span><strong>'+primary.symbol+'</strong></div><div><span>COMPARANDO COM</span><strong>'+targets+'</strong></div><div><span>PERÍODO</span><strong>'+date(result.rowsStart)+' → '+date(result.rowsEnd)+'</strong></div><div><span>INTERVALO</span><strong>'+result.interval+'</strong></div><div><span>OBSERVAÇÕES</span><strong>'+result.observations+'</strong></div></div><div class="context-method"><div><b>DESENHO DA INVESTIGAÇÃO</b><span>Dados alinhados por timestamp · retornos conforme a configuração · janela móvel conforme especificação · resultados condicionados à amostra INÍCIO → FIM.</span></div><button id="show-data-table" type="button">VER DADOS UTILIZADOS ↗</button><button id="show-method" type="button">MÉTODO ?</button></div><div class="context-note"><b>Como ler:</b> a referência foi escolhida na configuração da investigação. Todas as séries foram alinhadas pelos mesmos timestamps antes dos cálculos. O índice é calculado como <b>100 × P(t) / P(base)</b>. A escala vertical é logarítmica; o eixo horizontal respeita o tempo real dos timestamps. <b>INÍCIO e FIM definem a amostra estatística.</b> BASE 100 define apenas a âncora visual da comparação.</div>';
   $('#analysis-context').classList.remove('is-hidden');
 };

 const render=(result,series)=>{
   state.result=result;state.selected=series.map(x=>x.key);$('#comparison-panel').classList.remove('is-hidden');$('#analysis-status').textContent='CONCLUÍDA';
   $('#comparison-period').textContent=date(result.rowsStart)+' → '+date(result.rowsEnd)+' · '+result.observations+' observações';
   renderContext(result,series);renderChart(state.rows,series);renderMarkerTimeline();
   const primary=result.series[series[0].key],relations=result.relations;
   let html='<div class="analysis-section-label">RESULTADOS PRINCIPAIS · '+primary.symbol+' COMO REFERÊNCIA</div><div class="results-grid">'+metric('Retorno',pct(primary.total),'no período','Variação acumulada entre o primeiro e o último valor.')+metric('CAGR',pct(primary.cagr),'anualizado','Taxa composta anual equivalente ao período analisado.')+metric('Volatilidade',pct(primary.vol),'anualizada','Dispersão anualizada dos log-retornos.')+metric('Drawdown máximo',pct(primary.drawdown),'queda máxima','Maior perda de um pico até um vale no período.')+metric('Sharpe',fmt(primary.sharpe,3),'risco/retorno','Retorno médio ajustado pela volatilidade.')+metric('Sortino',fmt(primary.sortino,3),'risco de queda','Similar ao Sharpe, mas considera a dispersão negativa.')+metric('Win rate',pct(primary.winRate),'observações positivas','Percentual de períodos com retorno positivo.')+metric('ATH','$ '+fmt(primary.ath),'máxima observada','Maior preço observado na janela.')+'</div>';
   if(relations.length)html+='<div class="analysis-section-label">RELAÇÕES · REFERÊNCIA × ALVO</div><div class="results-grid">'+relations.map(r=>metric(r.target.toUpperCase()+' · CORR.',fmt(r.correlation,3),'associação','Correlação dos retornos; não implica causalidade.')+metric(r.target.toUpperCase()+' · BETA',fmt(r.beta,3),'sensibilidade','Sensibilidade do alvo em relação à referência.')+metric(r.target.toUpperCase()+' · R²',pct(r.r2),'ajuste linear','Parcela da variação do alvo explicada pelo modelo linear.')+metric(r.target.toUpperCase()+' · LEAD/LAG',String(r.leadLag.lag),'intervalos','Defasagem com maior correlação absoluta testada.')).join('')+'</div>';
   html+='<div class="analysis-section-label">AVANÇADO</div><div class="advanced-teaser"><span>Mediana, melhor/pior período, covariância, alpha, correlação móvel e diagnóstico de lead/lag.</span><button id="advanced-analysis">VER ESTATÍSTICAS AVANÇADAS ↗</button></div>';
   const em=result.explanatoryModel;
   if(em?.available){html+='<div class="analysis-section-label">EXPLICAÇÃO MULTIVARIADA · '+primary.symbol+'</div><div class="explanation-teaser"><div><b>PERGUNTA:</b> as variáveis selecionadas ajudam a explicar os retornos do '+primary.symbol+'?</div><strong>R² '+pct(em.r2,2)+' · R² ajustado '+pct(em.adjustedR2,2)+'</strong><small>Modelo linear conjunto sobre retornos alinhados. Associação estatística, não causalidade.</small></div>'}
   else if(series.length>1){html+='<div class="analysis-section-label">EXPLICAÇÃO MULTIVARIADA</div><div class="explanation-teaser is-unavailable"><b>MODELO NÃO ESTIMADO</b><small>'+em.reason+'</small></div>'}
   $('#analysis-results').innerHTML=html;$('#analysis-results').classList.remove('is-hidden');$('#full-analysis').classList.remove('is-hidden');$('#advanced-analysis').onclick=()=>openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date});wireMetricHelp($('#analysis-results'));document.querySelector('#show-data-table')?.addEventListener('click',()=>openDataTable({rows:state.rows?.slice(state.markers.start,state.markers.end+1)||[],keys:state.selected||[],assets,fmt,date}));document.querySelector('#show-method')?.addEventListener('click',()=>openInfo('MÉTODO'));
 };

 async function run(){
   const activeSymbol=getActiveSymbol(),reference=document.querySelector('#analysis-reference')?.value||activeSymbol,checked=[...document.querySelectorAll('.analysis-asset:checked')].map(x=>x.value),symbols=[reference,...checked.filter(x=>x!==reference)];
   $('#analysis-status').textContent='ANALISANDO';$('#analysis-results').classList.add('is-hidden');$('#full-analysis').classList.add('is-hidden');$('#comparison-panel').classList.add('is-hidden');$('#analysis-context').classList.add('is-hidden');
   try{const interval=getInterval()||'1d',period=document.querySelector('#analysis-period')?.value||'full',returnMode=document.querySelector('#analysis-return')?.value||'log',rollingWindow=Number(document.querySelector('#analysis-window')?.value||30),depth=document.querySelector('#analysis-depth')?.value||'key',series=[];for(const key of symbols){const meta=assets[key],loaded=key===activeSymbol?{candles:getCandles()}:await dataClient.loadOrPopulate({provider:meta.provider,symbol:meta.providerSymbol||key,kind:'ohlcv',interval,currency:'USD'});const candles=normalizeCandles(loaded.candles);if(candles.length<10)throw new Error('Poucos dados para '+meta.symbol+'.');series.push({key,symbol:meta.symbol,name:meta.name,candles})}let rows=alignSeries(series);if(rows.length<10)throw new Error('Poucos timestamps comuns para esta análise.');if(period!=='full'){const days=Number(period),cutoff=rows.at(-1).timestamp-days*86400000;rows=rows.filter(r=>r.timestamp>=cutoff);if(rows.length<10)throw new Error('O período escolhido não possui observações suficientes para esta análise.')}state.rows=rows;state.series=series;state.markers={start:0,base:0,end:rows.length-1};const result=analyzeSeries(rows,series,interval,{returnMode,rollingWindow});
   result.explanatoryModel=runExplanatoryModel(rows,series,{returnMode});
   result.modelDiagnostics=diagnoseModel(result.explanatoryModel);result.periodDays=period;result.rowsStart=rows[0].timestamp;result.rowsEnd=rows.at(-1).timestamp;render(result,series);if(depth==='full')openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date});else if(depth==='advanced')openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date})}catch(error){console.error('[ORACULUM ANALYSIS]',error);$('#analysis-status').textContent='ERRO';$('#analysis-results').innerHTML='<div class="analysis-diagnostics"><p>'+error.message+'</p></div>';$('#analysis-results').classList.remove('is-hidden')}}
 const button=$('#analyze-assets');button?.addEventListener('click',run);$('#full-analysis')?.addEventListener('click',()=>openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date}));
 const onResize=()=>{if(state.rows?.length){const selected=state.selected.map(k=>({...assets[k],key:k})).filter(Boolean);renderChart(state.rows,selected);renderMarkerTimeline()}};window.addEventListener('resize',onResize);return{run,destroy(){window.removeEventListener('resize',onResize)}};
}