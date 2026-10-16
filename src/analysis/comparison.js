/* ORACULUM — análise investigativa sob demanda */
import {analyzeSeries,alignSeries} from './engine.js';
import {openInfo} from './explanations.js';
import {openDataTable} from './data-table.js';
import {openModal} from './analysis-modal.js';
import {wireMetricHelp} from './metric-help.js';
import {runExplanatoryModel} from './explanatory-model.js';
import {diagnoseModel} from './model-diagnostics.js';
import {validateModelTwoWays,validateResidualDiagnostics} from './model-validation.js';
import {fmt,pct,date,metric,statBlock} from './view/formatters.js';
import {wireSummaryCopy} from './view/copy-results.js';
import {buildConclusion,buildMetricEducation,wireReportButtons} from './interpretation.js';
import {nearestTimelineIndex,timelineWindow,shiftTimelineWindow,resizeTimelineWindow,resizeTimelineDuration} from './timeline-state.js';

export function attachComparisonAnalysis({dataClient,normalizeCandles,getCandles,getInterval,getActiveSymbol,assets}){
 wireMetricHelp(document);
 const $=s=>document.querySelector(s),state={rows:null,result:null,selected:[],series:[],assetPool:[],timelineRows:{},commonSeries:[],timelineSlots:[],markers:{start:0,base:0,end:0},interval:'1d',independentTimelines:false};
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const markerDate=(rows,i)=>rows[i]?date(rows[i].timestamp):'—';
 const timelineRowsFor=slot=>Array.isArray(slot?.timelineRows)?slot.timelineRows:[];
 const rowsInWindow=slot=>{
   const w=slot?.window,rows=timelineRowsFor(slot);
   return w?.valid?rows.filter(r=>r.timestamp>=w.start&&r.timestamp<=w.end):[];
 };
 const periodKeyFor=row=>row?.__periodKey||row?.timestamp;
 const makeSlot=(asset,index)=>{
   const slot={...asset,key:'timeline-'+index,assetKey:asset.assetKey||asset.key,slotIndex:index};
   slot.timelineRows=alignSeries([slot],state.interval);
   return slot;
 };
 const startWindow=(slot,start,end,min=10)=>{
   const rows=timelineRowsFor(slot);
   if(!rows.length)return timelineWindow(rows,0,0,min);
   const a=nearestTimelineIndex(rows,start),b=nearestTimelineIndex(rows,end);
   return timelineWindow(rows,a<0?0:a,b<0?rows.length-1:b,min);
 };
 const syncComparisonDurations=()=>{
   const main=state.timelineSlots[0];
   if(!main?.window?.valid)return;
   for(const slot of state.timelineSlots.slice(1)){
     slot.window=resizeTimelineDuration(timelineRowsFor(slot),slot.window,main.window.durationMs,10);
   }
 };
 const renderTimelinePanel=()=>{
   const host=$('#comparison-timelines');
   if(!host||!state.timelineSlots.length)return;
   host.innerHTML=state.timelineSlots.map((slot,i)=>{
     const rows=timelineRowsFor(slot),w=slot.window,first=rows[0]?.timestamp??0,last=rows.at(-1)?.timestamp??first,span=Math.max(1,last-first);
     const left=w?.valid?clamp((w.start-first)/span*100,0,100):0,right=w?.valid?clamp((w.end-first)/span*100,0,100):100;
     const options=state.assetPool.map(asset=>'<option value="'+asset.assetKey+'" '+(asset.assetKey===slot.assetKey?'selected':'')+'>'+asset.symbol+' · '+asset.name+'</option>').join('');
     const title=i===0?'ATIVO PRINCIPAL':'COMPARAÇÃO '+i;
     const selector=i===0?'':'<select class="cmp-slot-asset" data-slot="'+i+'" aria-label="Ativo da timeline '+i+'">'+options+'</select>';
     const range='<div class="cmp-timeline-range" data-slot="'+i+'" style="left:'+left+'%;width:'+Math.max(0.8,right-left)+'%" '+(i===0?'aria-hidden="true"':'role="slider" aria-label="Deslocar período de '+slot.symbol+'" tabindex="0"')+'></div>';
     const handles=i===0?'<button class="cmp-timeline-handle handle-start" data-slot="0" data-edge="start" style="left:'+left+'%" aria-label="Alterar início '+date(w?.start)+'"></button><button class="cmp-timeline-handle handle-end" data-slot="0" data-edge="end" style="left:'+right+'%" aria-label="Alterar fim '+date(w?.end)+'"></button>':'';
     const dates=i===0?'<span class="cmp-timeline-date" style="left:'+left+'%">'+date(w?.start)+'</span><span class="cmp-timeline-date date-end" style="left:'+right+'%">'+date(w?.end)+'</span>':'';
     return '<section class="cmp-timeline-row" data-timeline-row="'+i+'"><div class="cmp-timeline-head"><div class="cmp-timeline-title"><strong>'+title+' · '+slot.symbol+'</strong><small>'+date(w?.start)+' → '+date(w?.end)+' · '+(w?.observations||0)+' observações</small></div>'+selector+'</div><div class="cmp-timeline-track" data-track="'+i+'"><div class="cmp-timeline-rail"></div>'+range+handles+dates+'</div><div class="cmp-timeline-foot"><span>Início <strong>'+date(w?.start)+'</strong></span><span class="timeline-shift">'+(i===0?'Ajuste as extremidades':'Arraste a faixa para outra época')+'</span><span>Fim <strong>'+date(w?.end)+'</strong></span></div></section>';
   }).join('');
   host.querySelectorAll('.cmp-slot-asset').forEach(select=>select.addEventListener('change',()=>switchTimelineAsset(Number(select.dataset.slot),select.value)));
   host.querySelectorAll('.cmp-timeline-handle').forEach(handle=>handle.addEventListener('pointerdown',event=>beginTimelineDrag(event,Number(handle.dataset.slot),handle.dataset.edge)));
   host.querySelectorAll('.cmp-timeline-range[role="slider"]').forEach(range=>{
     range.addEventListener('pointerdown',event=>beginTimelineDrag(event,Number(range.dataset.slot),'shift'));
     range.addEventListener('keydown',event=>{
       if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
       event.preventDefault();const slot=state.timelineSlots[Number(range.dataset.slot)],direction=event.key==='ArrowRight'?1:-1;
       slot.window=shiftTimelineWindow(timelineRowsFor(slot),slot.window,direction*slot.window.durationMs*.1,10);renderTimelinePanel();renderChart();recomputeTimelineAnalysis();
     });
   });
 };
 const beginTimelineDrag=(event,index,mode)=>{
   event.preventDefault();
   const slot=state.timelineSlots[index];if(!slot?.window?.valid)return;
   const baseWindow={...slot.window},startX=event.clientX,track=event.currentTarget.closest('.cmp-timeline-track'),rect=track.getBoundingClientRect(),rows=timelineRowsFor(slot),span=Math.max(1,(rows.at(-1)?.timestamp||0)-(rows[0]?.timestamp||0));
   const move=ev=>{
     const delta=(ev.clientX-startX)/Math.max(1,rect.width)*span;
     if(index===0&&mode!=='shift')slot.window=resizeTimelineWindow(rows,baseWindow,mode,delta,10);
     else slot.window=shiftTimelineWindow(rows,baseWindow,delta,10);
     if(index===0)syncComparisonDurations();
     renderTimelinePanel();renderChart();
   };
   const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);recomputeTimelineAnalysis()};
   window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
 };
 const switchTimelineAsset=(index,assetKey)=>{
   if(index===0)return;
   const asset=state.assetPool.find(x=>x.assetKey===assetKey);if(!asset)return;
   const previous=state.timelineSlots[index],slot=makeSlot(asset,index),main=state.timelineSlots[0];
   const targetStart=main?.window?.start??timelineRowsFor(slot)[0]?.timestamp,targetEnd=main?.window?.end??timelineRowsFor(slot).at(-1)?.timestamp;
   slot.window=startWindow(slot,targetStart,targetEnd,10);
   if(main?.window?.valid)slot.window=resizeTimelineDuration(timelineRowsFor(slot),slot.window,main.window.durationMs,10);
   state.timelineSlots[index]=slot;renderTimelinePanel();renderChart();recomputeTimelineAnalysis();
 };
 const renderChart=()=>{
   const host=$('#comparison-chart');if(!host||!state.timelineSlots.length)return;
   const w=Math.max(320,host.clientWidth||800),h=280,p={l:48,r:18,t:20,b:34};
   const plotted=state.timelineSlots.map(slot=>({slot,rows:rowsInWindow(slot)})).filter(x=>x.rows.length>=2);
   if(!plotted.length){host.innerHTML='<p class="analysis-layer-note">Não há observações suficientes para desenhar a comparação.</p>';return}
   const normalized=plotted.map(({slot,rows})=>({slot,rows,values:rows.map(r=>100*Number(r[slot.key])/Number(rows[0][slot.key]))})).filter(x=>x.values.every(v=>Number.isFinite(v)&&v>0));
   const all=normalized.flatMap(x=>x.values);if(!all.length){host.innerHTML='<p class="analysis-layer-note">Preços inválidos para normalização em base 100.</p>';return}
   const lo=Math.log(Math.min(...all)),hi=Math.log(Math.max(...all));
   const line=values=>values.map((v,i)=>{const x=p.l+(i/Math.max(1,values.length-1))*(w-p.l-p.r),y=h-p.b-(Math.log(Math.max(.0001,v))-lo)/(hi-lo||1)*(h-p.t-p.b);return x.toFixed(2)+','+y.toFixed(2)}).join(' ');
   const polylines=normalized.map((x,i)=>'<polyline points="'+line(x.values)+'" class="cmp-line cmp-'+i+'"/>').join('');
   host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="Comparação normalizada por tempo relativo; cada janela começa em base 100"><line x1="'+p.l+'" x2="'+p.l+'" y1="'+p.t+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h-p.b)+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h/2)+'" y2="'+(h/2)+'" class="cmp-grid"/>'+polylines+'<text x="'+p.l+'" y="'+(h-8)+'">Início relativo</text><text x="'+(w-p.r)+'" y="'+(h-8)+'" text-anchor="end">Fim relativo</text><text x="'+(p.l+6)+'" y="'+(h/2-6)+'">100 = início de cada janela</text></svg>';
   const legend=$('#comparison-legend');if(legend)legend.innerHTML=normalized.map((x,i)=>'<span><i class="legend-'+i+'"></i>'+x.slot.symbol+'<small class="cmp-legend-period">'+date(x.rows[0].timestamp)+' → '+date(x.rows.at(-1).timestamp)+'</small></span>').join('');
 };
 const sameWindowDates=slots=>slots.every(slot=>{
   const rows=rowsInWindow(slot),first=rows[0],last=rows.at(-1),main=rowsInWindow(slots[0]);
   return first&&last&&main[0]&&main.at(-1)&&periodKeyFor(first)===periodKeyFor(main[0])&&periodKeyFor(last)===periodKeyFor(main.at(-1));
 });
 const recomputeTimelineAnalysis=()=>{
   if(!state.timelineSlots.length)return;
   const returnMode=$('#analysis-return')?.value||'log',rollingWindow=Number($('#analysis-window')?.value||30),interval=state.interval||'1d',slots=state.timelineSlots;
   const timelineRows=Object.fromEntries(slots.map(slot=>[slot.key,rowsInWindow(slot)]));
   if(slots.some(slot=>timelineRows[slot.key].length<10)){
     $('#analysis-status').textContent='AMOSTRA INSUFICIENTE';return;
   }
   state.timelineRows=timelineRows;state.series=slots;state.selected=slots.map(slot=>slot.key);
   const windowedSeries=slots.map(slot=>({...slot,candles:slot.candles.filter(c=>Number(c.timestamp)>=slot.window.start&&Number(c.timestamp)<=slot.window.end)}));
   const commonRows=alignSeries(windowedSeries,interval),hasCommon=commonRows.length>=10;
   const commonResult=hasCommon?analyzeSeries(commonRows,windowedSeries,interval,{returnMode,rollingWindow}):null;
   const individualResults=slots.map(slot=>({slot,result:analyzeSeries(timelineRows[slot.key],[slot],interval,{returnMode,rollingWindow})}));
   const primaryRows=timelineRows[slots[0].key],primaryResult=individualResults[0].result;
   let result;
   if(hasCommon){
     result=commonResult;
     result.relations=commonResult.relations;
     result.explanatoryModel=runExplanatoryModel(commonRows,windowedSeries,{returnMode});
     result.modelDiagnostics=diagnoseModel(result.explanatoryModel);result.modelValidation=validateModelTwoWays(result.explanatoryModel);result.residualValidation=validateResidualDiagnostics(result.explanatoryModel,result.modelDiagnostics);
     state.rows=commonRows;state.commonSeries=windowedSeries;state.independentTimelines=!sameWindowDates(slots);
   }else{
     result={...primaryResult,relations:[],temporal:{method:'individual selected windows; no common calendar sample with enough observations for cross-series inference',sharedRows:0,firstBucket:null,lastBucket:null,gaps:0},alignedObservations:0};
     result.explanatoryModel={available:false,reason:'As janelas selecionadas não têm pelo menos 10 observações em datas comuns; o modelo multivariado foi omitido para evitar pareamento artificial.'};
     result.modelDiagnostics={available:false,heteroskedasticity:{available:false}};
     result.modelValidation={status:'NOT_CHECKED',passed:0,total:0,checks:[],message:'Não aplicável sem amostra comum suficiente.'};
     result.residualValidation={status:'NOT_CHECKED',passed:0,total:0,checks:[],reason:'Modelo multivariado não estimado.'};
     state.rows=primaryRows;state.commonSeries=[slots[0]];state.independentTimelines=true;
   }
   result.series={};
   for(const {slot,result:individual} of individualResults)result.series[slot.key]=individual.series[slot.key];
   if(hasCommon){
     result.audit={...commonResult.audit,series:Object.assign({},...individualResults.map(x=>x.result.audit?.series||{})),relations:commonResult.audit?.relations||[]};
   }else result.audit={...primaryResult.audit,series:Object.assign({},...individualResults.map(x=>x.result.audit?.series||{})),relations:[]};
   result.interval=interval;result.returnMode=returnMode;result.rollingWindow=rollingWindow;result.observations=primaryRows.length;result.alignedObservations=hasCommon?commonRows.length:0;
   result.rowsStart=primaryRows[0].timestamp;result.rowsEnd=primaryRows.at(-1).timestamp;result.periodDays=(result.rowsEnd-result.rowsStart)/86400000;
   result.temporal={...(result.temporal||{}),method:hasCommon?'individual native-window statistics; cross-series inference on shared calendar buckets within selected windows':'individual selected windows; no valid shared sample for cross-series inference',sharedRows:hasCommon?commonRows.length:0};
   state.result=result;state.markers={start:0,base:0,end:Math.max(0,(state.rows?.length||1)-1)};
   render(result,slots);
 };
 const initializeTimelineSlots=(pool,reference,interval,period)=>{
   state.interval=interval;state.assetPool=pool;const mainRows=alignSeries([pool.find(x=>x.assetKey===reference)||pool[0]],interval);
   if(mainRows.length<10)throw new Error('Poucos dados para a timeline principal.');
   let mainStart=mainRows[0].timestamp,mainEnd=mainRows.at(-1).timestamp;
   if(period!=='full'){const days=Number(period);mainStart=Math.max(mainStart,mainEnd-days*86400000);const at=nearestTimelineIndex(mainRows,mainStart);mainStart=mainRows[Math.max(0,at)].timestamp;}
   const selectedKeys=[...new Set([...document.querySelectorAll('.analysis-asset:checked')].map(x=>x.value).filter(x=>pool.some(a=>a.assetKey===x)))];
   const choices=[reference,selectedKeys[0]||reference,selectedKeys[1]||reference];
   state.timelineSlots=choices.map((key,index)=>{
     const asset=pool.find(x=>x.assetKey===key)||pool[0],slot=makeSlot(asset,index),rows=timelineRowsFor(slot);
     slot.window=startWindow(slot,mainStart,mainEnd,10);return slot;
   });
   syncComparisonDurations();renderTimelinePanel();
 };

 const renderContext=(result,series)=>{
   const primary=series[0],targets=series.slice(1).map(s=>s.symbol).join(' + ')||'nenhum alvo selecionado';
   const windows=series.map(s=>s.symbol+': '+date(s.window?.start??result.rowsStart)+' → '+date(s.window?.end??result.rowsEnd)).join(' · ');
   const common=result.temporal?.sharedRows??0;
   const relationText=common>=10?'Relações, beta e regressão usam somente buckets de calendário comuns dentro das janelas selecionadas ('+common+' observações).':'As janelas não têm amostra comum suficiente; correlações, beta e regressão ficam indisponíveis para evitar pareamento artificial.';
   $('#analysis-context').innerHTML='<div class="context-row"><div><span>ATIVO INVESTIGADO</span><strong>'+primary.symbol+'</strong></div><div><span>COMPARAÇÕES</span><strong>'+targets+'</strong></div><div><span>PERÍODO PRINCIPAL</span><strong>'+date(result.rowsStart)+' → '+date(result.rowsEnd)+'</strong></div><div><span>INTERVALO</span><strong>'+result.interval+'</strong></div><div><span>OBSERVAÇÕES PRINCIPAIS</span><strong>'+result.observations+'</strong></div></div><div class="context-method"><div><b>JANELAS SELECIONADAS</b><span>'+windows+'</span></div><button id="show-data-table" type="button">VER DADOS COMUNS ↗</button><button id="show-method" type="button">MÉTODO ?</button></div><div class="context-note"><b>Desenho científico:</b> as estatísticas individuais usam a janela escolhida para cada série. '+relationText+' A comparação visual usa tempo relativo, normalizando cada janela em 100 no seu primeiro preço; portanto, deslocar uma janela compara épocas diferentes, não retornos simultâneos. Associação não implica causalidade.</div>';
   $('#analysis-context').classList.remove('is-hidden');
 };


 function auditNumber(value,digits=8){
   if(value===null||value===undefined||!Number.isFinite(Number(value)))return 'indefinido';
   const n=Number(value);
   if(n!==0&&Math.abs(n)<1e-7)return n.toExponential(3);
   return n.toLocaleString('pt-BR',{maximumFractionDigits:digits});
 }
 function auditPct(value){return Number.isFinite(value)?auditNumber(value*100,6)+'%':'indefinido'}
 function auditDate(value){return Number.isFinite(Number(value))?new Date(Number(value)).toISOString().slice(0,10):'indefinida'}
 function auditTimestamp(value){return Number.isFinite(Number(value))?new Date(Number(value)).toISOString():'indefinido'}
 function buildAuditReport(result,series,rows,markers){
   const sampleRows=Array.isArray(rows)?rows.slice(markers?.start??0,(markers?.end??(rows.length-1))+1):[];
   const mode=result.returnMode==='simple'?'simples':'logarítmico';
   const lines=[
     'ORACULUM — RELATÓRIO PARA AUDITORIA ESTATÍSTICA',
     '',
     'INSTRUÇÕES PARA A AUDITORIA',
     'Verifique a coerência matemática dos resultados e das fórmulas; não presuma que o código está correto só porque produziu números.',
     'Separe: (1) confirmado, (2) suspeito, (3) impossível de concluir com este resumo. Explique o motivo e indique o arquivo/fórmula a conferir.',
     'Confira especialmente retornos, CAGR, volatilidade anualizada, drawdown, VaR/ES, covariância, beta/alpha, OLS, erros-padrão HAC, p-valores e diagnósticos dos resíduos.',
     'Não afirme causalidade. Se faltar informação para validar um resultado, peça apenas o trecho exato de dados ou código necessário; não invente valores esperados.',
     '',
     '1. CONFIGURAÇÃO E AMOSTRA',
     'Ativo investigado: '+(series[0]?.symbol||'indefinido'),
     'Comparações: '+(series.slice(1).map(s=>s.symbol).join(', ')||'nenhuma'),
     'Período comum: '+auditDate(result.rowsStart)+' a '+auditDate(result.rowsEnd),
     'Intervalo solicitado: '+(result.interval||'indefinido')+' | Tipo de retorno: '+mode,
     'Desenho temporal: estatísticas individuais em observações nativas; relações e modelo multivariado em buckets comuns. Retornos comuns são close-to-close e podem abranger mais de 1 dia de calendário.',
     'Buckets comuns: '+(result.temporal?.sharedRows??result.observations)+' | lacunas acima de 1,5 dia entre timestamps comuns: '+(result.temporal?.gaps??'não calculado'),
     'Observações de preço na amostra comum: '+(sampleRows.length||result.observations||'indefinidas'),
     'Retornos válidos por série: '+series.map(s=>s.symbol+'='+((result.series?.[s.key]?.returns||[]).filter(Number.isFinite).length)).join(' | '),
     'Janela móvel: '+(result.rollingWindow??'indefinida')+' | Períodos anualizados: '+(result.periods??'indefinido'),
     'Marcadores da amostra: início '+auditDate(sampleRows[0]?.timestamp)+' | base visual '+auditDate(rows?.[markers?.base]?.timestamp)+' | fim '+auditDate(sampleRows.at(-1)?.timestamp),
     'Nota: a base 100 afeta o gráfico comparativo, não deve alterar as estatísticas calculadas sobre a amostra selecionada.',
     '',
     '2. RESULTADOS POR SÉRIE'
   ];
   for(const s of series){
     const x=result.series?.[s.key];if(!x)continue;
     lines.push(
       '',s.symbol,
       'Preços inicial/final: '+auditNumber(x.start)+' / '+auditNumber(x.end),
       'Amostra nativa: '+(x.nativeObservations??'—')+' preços / '+(x.validReturns??'—')+' retornos válidos | anualização: '+(x.annualizationCalendar||'não informada')+' ('+(x.annualizationPeriods??'—')+' períodos/ano)',
       'Retorno acumulado: '+auditPct(x.total)+' | CAGR: '+auditPct(x.cagr)+' | Volatilidade anualizada: '+auditPct(x.vol),
       'Drawdown máximo: '+auditPct(x.drawdown)+' | Sharpe: '+auditNumber(x.sharpe,6)+' | Sortino: '+auditNumber(x.sortino,6)+' | Win rate: '+auditPct(x.winRate),
       'Retorno médio: '+auditPct(x.mean)+' | Mediana: '+auditPct(x.median)+' | Desvio-padrão por intervalo: '+auditPct(x.std),
       'Variância: '+auditNumber(x.variance,12)+' | Erro-padrão da média: '+auditPct(x.se),
       'Melhor/pior retorno: '+auditPct(x.best)+' / '+auditPct(x.worst),
       'Assimetria: '+auditNumber(x.skewness,6)+' | Curtose excedente: '+auditNumber(x.excessKurtosis,6),
       'VaR 95%/99%: '+auditPct(x.var95)+' / '+auditPct(x.var99)+' | ES 95%/99%: '+auditPct(x.es95)+' / '+auditPct(x.es99),
       'Calmar: '+auditNumber(x.calmar,6)+' | ATL/ATH: '+auditNumber(x.atl)+' / '+auditNumber(x.ath),
       'Jarque–Bera: estatística '+auditNumber(x.jarqueBera?.stat,8)+' | p '+auditNumber(x.jarqueBera?.p,8)
     );
   }
   lines.push('','3. RELAÇÕES ENTRE O ATIVO INVESTIGADO E AS SÉRIES COMPARADAS');
   for(const r of result.relations||[]){
     lines.push(
       '',r.primary+' × '+r.target,
       'Correlação: '+auditNumber(r.correlation,8)+' | Covariância: '+auditNumber(r.covariance,12),
       'Beta: '+auditNumber(r.beta,8)+' | Alpha: '+auditNumber(r.alpha,10)+' | R²: '+auditPct(r.r2),
       'Correlação móvel final: '+auditNumber(r.rolling,8),
       'Lead/Lag escolhido: '+(r.leadLag?.lag??'indefinido')+' intervalos | correlação correspondente: '+auditNumber(r.leadLag?.corr,8),
       'Defasagem absoluta entre timestamps-fonte: mediana '+auditNumber(r.temporalAlignment?.timestampOffsetMedianHours,2)+' h | máxima '+auditNumber(r.temporalAlignment?.timestampOffsetMaxHours,2)+' h ('+(r.temporalAlignment?.timestampOffsetObservations??0)+' buckets com metadados)',
       'Intervalo nativo mediano entre observações: referência '+auditNumber(r.temporalAlignment?.primaryElapsedDaysMedian,2)+' dias | alvo '+auditNumber(r.temporalAlignment?.targetElapsedDaysMedian,2)+' dias',
       'Limitação temporal: '+(r.timingCaveat||'horários de fechamento podem não ser simultâneos; verificar timestamps-fonte.')
     );
   }
   const m=result.explanatoryModel,d=result.modelDiagnostics;
   const validation=result.modelValidation;lines.push('','CONFERÊNCIA NUMÉRICA ENTRE IMPLEMENTAÇÕES: '+(validation?.status||'NOT_CHECKED')+' · '+(validation?.passed??0)+'/'+(validation?.total??0)+' verificações');if(validation?.reason)lines.push('Motivo da não verificação: '+validation.reason);for(const item of validation?.checks||[])lines.push(item.status+' · '+item.name+' | cálculo A='+auditNumber(item.primary,12)+' | cálculo B='+auditNumber(item.reference,12));
   const rv=result.residualValidation;lines.push('','RECOMPUTAÇÃO INDEPENDENTE DOS DIAGNÓSTICOS RESIDUAIS: '+(rv?.status||'NOT_CHECKED')+' · '+(rv?.passed??0)+'/'+(rv?.total??0)+' verificações');if(rv?.reason)lines.push('Motivo: '+rv.reason);for(const item of rv?.checks||[])lines.push(item.status+' · '+item.name+' | observado='+auditNumber(item.primary,12)+' | referência independente='+auditNumber(item.reference,12));if(Number.isFinite(rv?.firstLagContributionToLjungBox))lines.push('Contribuição mínima da defasagem 1 ao Q de Ljung–Box: '+auditNumber(rv.firstLagContributionToLjungBox,10));if(rv?.warning)lines.push('Limitação: '+rv.warning);
   lines.push('','4. MODELO MULTIVARIADO E RESÍDUOS');
   if(!m?.available)lines.push('Modelo não estimado: '+(m?.reason||'motivo não informado'));
   else{
     lines.push(
       'Alvo: '+m.target+' | Preditores: '+(m.predictors||[]).join(', '),
       'Observações: '+m.observations+' | R²: '+auditPct(m.r2)+' | R² ajustado: '+auditPct(m.adjustedR2),
       'F: '+auditNumber(m.f,8)+' | p do F: '+auditNumber(m.fP,10)+' | graus de liberdade residuais: '+(m.df??'indefinidos'),
       'RMSE (SSE/n): '+auditNumber(m.rmse,12)+' | erro-padrão residual (SSE/gl): '+auditNumber(m.residualStandardError,12)+' | SSE: '+auditNumber(m.sse,12)+' | SST: '+auditNumber(m.sst,12)+' | HAC lag: '+(m.hacLag??'indefinido')
     );
     lines.push('Coeficientes OLS (β | erro-padrão | t | p | IC95%):');
     for(const c of m.coefficients||[])lines.push(c.name+': '+auditNumber(c.beta,10)+' | '+auditNumber(c.se,10)+' | '+auditNumber(c.t,8)+' | '+auditNumber(c.p,10)+' | ['+auditNumber(c.ciLow,10)+', '+auditNumber(c.ciHigh,10)+']');
     lines.push('Inferência HAC: '+(m.hacMethod||'Newey–West')+' | correção finita '+(m.hacFiniteSampleCorrection||'não informada')+' | p-valores '+(m.hacPValueMethod||'método não informado')+'.');
      lines.push('HAC ajusta a matriz de covariância para dependência serial/heterocedasticidade; p-valores são assintóticos e não garantem bom desempenho em amostras pequenas.');
      lines.push('Coeficientes HAC/Newey–West (β | HAC SE | HAC t | HAC p):');
     for(const c of m.hacCoefficients||[])lines.push(c.name+': '+auditNumber(c.beta,10)+' | '+auditNumber(c.hacSe,10)+' | '+auditNumber(c.hacT,8)+' | '+auditNumber(c.hacP,10));
     lines.push('VIF: '+(m.vif||[]).map((v,i)=>(m.predictors?.[i]||('preditor '+(i+1)))+'='+auditNumber(v.vif,8)).join(' | '));
     if(d?.available)lines.push(
       'Resíduos: média '+auditNumber(d.residualMean,12)+' | desvio-padrão '+auditNumber(d.residualStd,12)+' | máximo absoluto '+auditNumber(d.maxAbsResidual,12),
       'Durbin–Watson: '+auditNumber(d.durbinWatson,8)+' (numerador '+auditNumber(d.durbinWatsonNumerator,10)+' / denominador '+auditNumber(d.durbinWatsonDenominator,10)+') | correlação residual lag 1: '+auditNumber(d.residualLag1Correlation,8),
       'Ljung–Box: Q='+auditNumber(d.ljungBox?.stat,8)+', gl='+ (d.ljungBox?.df??'indefinidos')+', p='+auditNumber(d.ljungBox?.p,10)+' | n resíduos='+ (d.ljungBox?.residualCount??'indefinido'),
       'Espaçamento temporal: '+(d.temporalSpacing?.status||'TIMING_UNKNOWN')+' | intervalos n='+ (d.temporalSpacing?.intervalCount??0)+' | min/mediana/máx (dias)='+auditNumber(d.temporalSpacing?.minDays,4)+' / '+auditNumber(d.temporalSpacing?.medianDays,4)+' / '+auditNumber(d.temporalSpacing?.maxDays,4)+' | inferência formal elegível='+String(Boolean(d.temporalSpacing?.formalInferenceEligible)),
       ...(d.temporalSpacing?.warning?[d.temporalSpacing.warning]:[]),
       'Razão de variâncias entre metades: '+auditNumber(d.varianceRatio,8)
     );
     if(d?.heteroskedasticity?.available){
       lines.push('','Diagnósticos de heterocedasticidade / variância condicional:');
       for(const test of d.heteroskedasticity.tests||[])lines.push(test.method+' | '+(test.available?'LM='+auditNumber(test.statistic,8)+' | gl='+test.df+' | p='+auditNumber(test.pValue,10)+' | '+test.interpretation:'INCONCLUSIVO | '+test.reason));
       for(const note of d.heteroskedasticity.notes||[])lines.push('Nota metodológica: '+note);
     }
   }
   lines.push('','5. CARIMBOS DE CÁLCULO E CONSISTÊNCIA');
   lines.push('Versão matemática: '+(result.audit?.mathVersion||'indefinida')+' | Escopo: consistência interna; não equivale a validação independente.');
   for(const s of series){
     const stamped=result.audit?.series?.[s.key];
     if(!stamped)continue;
     lines.push('',s.symbol+' · '+stamped.validReturns+' retornos válidos / '+stamped.observations+' linhas de preço');
     for(const [name,stamp] of Object.entries(stamped.calculations||{})){
       lines.push(name+' | '+stamp.id+' | estado='+stamp.status+' | n='+stamp.observations);
       lines.push('  Fórmula: '+stamp.formula);
       if(stamp.checks?.length)for(const check of stamp.checks)lines.push('  Verificação '+check.name+': '+check.status+' | observado='+auditNumber(check.actual,12)+' | esperado='+auditNumber(check.expected,12));
       if(stamp.assumptions?.length)lines.push('  Pressupostos: '+stamp.assumptions.join('; '));
     }
   }
   for(const stamp of result.audit?.relations||[]){
     lines.push('',stamp.id+' | '+stamp.status+' | n='+stamp.observations+' | '+stamp.formula);
     for(const check of stamp.checks||[])lines.push('  Verificação '+check.name+': '+check.status+' | observado='+auditNumber(check.actual,12)+' | referência='+auditNumber(check.expected,12));
   }
   lines.push('','6. TRECHOS DE DADOS PARA CONFERÊNCIA RÁPIDA');
   if(sampleRows.length){
     const indices=[...new Set([0,1,2,Math.floor((sampleRows.length-1)/2)-1,Math.floor((sampleRows.length-1)/2),Math.floor((sampleRows.length-1)/2)+1,sampleRows.length-3,sampleRows.length-2,sampleRows.length-1])].filter(i=>i>=0&&i<sampleRows.length).sort((a,b)=>a-b);
     lines.push('Amostra curta de preços alinhados; serve para inspeção pontual, não para recalcular sozinha toda a regressão.');
     lines.push('Data do bucket | '+series.map(s=>s.symbol+' preço @ timestamp-fonte UTC').join(' | '));
     for(const i of indices)lines.push(auditDate(sampleRows[i].timestamp)+' | '+series.map(s=>auditNumber(sampleRows[i][s.key],8)+' @ '+auditTimestamp(sampleRows[i].__sourceTimestamps?.[s.key])).join(' | '));
   }else lines.push('Trechos de preços não disponíveis nesta exportação.');
   lines.push('','Se um cálculo não puder ser validado com este resumo, solicite a amostra adicional ou o trecho de código estritamente necessário.');
   return lines.join('\n');
 }

 const render=(result,series)=>{
   state.result=result;state.selected=series.map(x=>x.key);$('#comparison-panel').classList.remove('is-hidden');$('#analysis-status').textContent='CONCLUÍDA';
   $('#comparison-period').textContent=date(result.rowsStart)+' → '+date(result.rowsEnd)+' · '+result.observations+' observações';
   renderContext(result,series);renderChart();renderTimelinePanel();
   const primary=result.series[series[0].key],relations=result.relations;
   let html=buildConclusion(result,series)+buildMetricEducation(result,series)+'<div class="analysis-section-label">1 · DISTRIBUIÇÃO DOS RETORNOS · '+primary.symbol+'</div><p class="analysis-layer-note">Primeiro, entenda o comportamento típico de cada intervalo. Depois, avance para performance, risco e relações.</p><div class="results-grid">'+metric('Média',pct(primary.mean),'por intervalo','Média dos retornos da amostra. Pode ser influenciada por valores extremos.')+metric('Desvio-padrão',pct(primary.std),'por intervalo','Dispersão dos retornos em torno da média; é a medida básica de volatilidade por intervalo.')+metric('Mediana',pct(primary.median),'por intervalo','Retorno central: metade dos retornos fica abaixo e metade acima.')+metric('Melhor intervalo',pct(primary.best),'maior retorno','Maior retorno observado em uma única observação.')+metric('Pior intervalo',pct(primary.worst),'menor retorno','Menor retorno observado em uma única observação.')+metric('Observações',fmt(primary.returns?.filter(Number.isFinite).length,0),'retornos válidos','Quantidade de retornos válidos; normalmente um a menos que o número de preços.')+'</div><div class="analysis-section-label">2 · PERFORMANCE E RISCO</div><div class="results-grid">'+metric('Retorno acumulado',pct(primary.total),'no período','Variação total do preço entre o primeiro e o último valor.')+metric('CAGR',pct(primary.cagr),'anualizado','Taxa composta anual equivalente ao período analisado.')+metric('Volatilidade',pct(primary.vol),'anualizada','Desvio-padrão dos retornos anualizado; difere do desvio-padrão por intervalo acima.')+metric('Drawdown máximo',pct(primary.drawdown),'queda máxima','Maior perda de um pico até um vale no período.')+metric('Sharpe',fmt(primary.sharpe,3),'risco/retorno','Retorno médio ajustado pela volatilidade; esta versão não desconta taxa livre de risco.')+metric('Sortino',fmt(primary.sortino,3),'risco de queda','Relaciona retorno médio à dispersão negativa, conforme a convenção indicada na ajuda.')+metric('Win rate',pct(primary.winRate),'intervalos positivos','Percentual de retornos positivos.')+metric('ATH','$ '+fmt(primary.ath),'máxima observada','Maior preço observado na janela.')+'</div>';
   if(relations.length)html+='<div class="analysis-section-label">RELAÇÕES · ATIVO INVESTIGADO × SÉRIES COMPARADAS</div><div class="results-grid">'+relations.map(r=>metric(r.target.toUpperCase()+' · CORR.',fmt(r.correlation,3),'associação','Correlação dos retornos; não implica causalidade.')+metric(r.target.toUpperCase()+' · BETA',fmt(r.beta,3),'sensibilidade','Sensibilidade do alvo em relação à referência.')+metric(r.target.toUpperCase()+' · R²',pct(r.r2),'ajuste linear','Parcela da variação do alvo explicada pelo modelo linear.')+metric(r.target.toUpperCase()+' · LEAD/LAG',String(r.leadLag.lag),'intervalos','Defasagem com maior correlação absoluta testada.')).join('')+'</div>';
   const validation=result.modelValidation||{status:'NOT_CHECKED',passed:0,total:0,checks:[]};
   const validationLabel=validation.status==='BOTH_PATHS_AGREE'?'AMBOS OS CAMINHOS CONCORDAM':validation.status==='ALERT'?'DIVERGÊNCIA — REVISÃO NECESSÁRIA':'AINDA NÃO VALIDADO';
   const validationColor=validation.status==='BOTH_PATHS_AGREE'?'#4ade80':validation.status==='ALERT'?'#fb7185':'#fbbf24';
   html+='<div class="analysis-validation" role="status" style="margin:16px 0;padding:14px;border:1px solid '+validationColor+';border-radius:12px;background:rgba(15,23,42,.72);color:#e2e8f0"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><strong style="color:'+validationColor+'">'+validationLabel+'</strong><span>'+validation.passed+'/'+validation.total+' verificações numéricas</span></div><p style="margin:8px 0 0;font-size:13px">'+(validation.message||'A conferência numérica ainda não está disponível.')+'</p><details style="margin-top:8px"><summary style="cursor:pointer">Ver verificações</summary><ul style="margin:8px 0 0;padding-left:20px">'+(validation.checks||[]).map(item=>'<li>'+item.status+' · '+item.name+'</li>').join('')+'</ul><small>Concordância entre implementações não equivale a benchmark externo independente. Validade econômica, causalidade e adequação do modelo não estão confirmadas.</small></details></div>';
   html+='<div class="analysis-section-label">AVANÇADO</div><div class="advanced-teaser"><span>Mediana, melhor/pior período, covariância, alpha, correlação móvel e diagnóstico de lead/lag.</span><button id="advanced-analysis">VER ESTATÍSTICAS AVANÇADAS ↗</button></div>';
   const em=result.explanatoryModel;
   if(em?.available){html+='<div class="analysis-section-label">EXPLICAÇÃO MULTIVARIADA · '+primary.symbol+'</div><div class="explanation-teaser"><div><b>PERGUNTA:</b> as variáveis selecionadas ajudam a explicar os retornos do '+primary.symbol+'?</div><strong>R² '+pct(em.r2,2)+' · R² ajustado '+pct(em.adjustedR2,2)+'</strong><small>Modelo linear conjunto sobre retornos alinhados. Associação estatística, não causalidade.</small></div>'}
   else if(series.length>1){html+='<div class="analysis-section-label">EXPLICAÇÃO MULTIVARIADA</div><div class="explanation-teaser is-unavailable"><b>MODELO NÃO ESTIMADO</b><small>'+em.reason+'</small></div>'}
   const diag=result.modelDiagnostics?.heteroskedasticity;
   if(diag?.available){
     const testCards=(diag.tests||[]).map(t=>{
       const color=!t.available?'#fbbf24':t.pValue<0.05?'#fb7185':'#4ade80';
       const status=!t.available?'INCONCLUSIVO':t.pValue<0.05?'SINAL DETECTADO':'SEM SINAL FORTE';
       return '<div style="border:1px solid '+color+';border-radius:10px;padding:10px;min-width:0"><b>'+t.method+'</b><div style="color:'+color+';font-size:12px;margin:5px 0">'+status+'</div><div>LM: '+(Number.isFinite(t.statistic)?fmt(t.statistic,3):'—')+'</div><div>gl: '+(t.df??'—')+' · p: '+(Number.isFinite(t.pValue)?fmt(t.pValue,5):'—')+'</div><small>'+(t.available?'Hipótese nula: '+t.nullHypothesis:t.reason)+'</small></div>';
     }).join('');
     html+='<div class="analysis-section-label">DIAGNÓSTICO DOS RESÍDUOS · VARIÂNCIA</div><p class="analysis-layer-note">p &lt; 0,05 é evidência contra a hipótese nula específica. Um p maior não comprova variância constante.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">'+testCards+'</div><details style="margin:8px 0"><summary style="cursor:pointer">Método e limitações</summary><ul>'+diag.notes.map(note=>'<li>'+note+'</li>').join('')+'</ul></details>';
   }
   $('#analysis-results').innerHTML=html;$('#analysis-results').classList.remove('is-hidden');wireSummaryCopy($('#analysis-results'),{context:$('#analysis-context'),auditText:()=>buildAuditReport(state.result,state.series,state.rows,state.markers)});wireReportButtons($('#analysis-results'),state.result,state.series);$('#full-analysis').classList.remove('is-hidden');$('#advanced-analysis').onclick=()=>openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date});wireMetricHelp($('#analysis-results'));document.querySelector('#show-data-table')?.addEventListener('click',()=>openDataTable({rows:state.rows?.slice(state.markers.start,state.markers.end+1)||[],keys:state.selected||[],assets,fmt,date}));document.querySelector('#show-method')?.addEventListener('click',()=>openInfo('MÉTODO'));
 };

 async function run(){
   const activeSymbol=getActiveSymbol(),reference=document.querySelector('#analysis-reference')?.value||activeSymbol,checked=[...document.querySelectorAll('.analysis-asset:checked')].map(x=>x.value),symbols=[reference,...checked.filter(x=>x!==reference)];
   $('#analysis-status').textContent='ANALISANDO';$('#analysis-results').classList.add('is-hidden');$('#full-analysis').classList.add('is-hidden');$('#comparison-panel').classList.add('is-hidden');$('#analysis-context').classList.add('is-hidden');
   try{const requestedInterval=getInterval()||'1d',hasDailySeries=symbols.some(key=>assets[key]?.supportedIntervals),interval=hasDailySeries?'1d':requestedInterval,period=document.querySelector('#analysis-period')?.value||'full',returnMode=document.querySelector('#analysis-return')?.value||'log',rollingWindow=Number(document.querySelector('#analysis-window')?.value||30),depth=document.querySelector('#analysis-depth')?.value||'key',series=[];for(const key of symbols){const meta=assets[key],sameLoadedAsset=key===activeSymbol&&interval===requestedInterval,loaded=sameLoadedAsset?{candles:getCandles()}:await dataClient.loadOrPopulate({provider:meta.provider,symbol:meta.providerSymbol||key,kind:meta.kind||'ohlcv',interval:meta.supportedIntervals?.includes(interval)?interval:(meta.supportedIntervals?.[0]||interval),currency:'USD'});const candles=normalizeCandles(loaded.candles);if(candles.length<10)throw new Error('Poucos dados para '+meta.symbol+'.');series.push({key,symbol:meta.symbol,name:meta.name,category:meta.category,candles})}let rows=alignSeries(series,interval);if(rows.length<10)throw new Error('Poucos timestamps comuns para esta análise.');if(period!=='full'){const days=Number(period),cutoff=rows.at(-1).timestamp-days*86400000;rows=rows.filter(r=>r.timestamp>=cutoff);if(rows.length<10)throw new Error('O período escolhido não possui observações suficientes para esta análise.')}state.rows=rows;state.series=series;state.markers={start:0,base:0,end:rows.length-1};const calendar=series.some(s=>s.category&&!['crypto','test'].includes(s.category))?'trading':'continuous';const result=analyzeSeries(rows,series,interval,{returnMode,rollingWindow,calendar});
   result.explanatoryModel=runExplanatoryModel(rows,series,{returnMode});
   result.modelDiagnostics=diagnoseModel(result.explanatoryModel);result.modelValidation=validateModelTwoWays(result.explanatoryModel);result.residualValidation=validateResidualDiagnostics(result.explanatoryModel,result.modelDiagnostics);result.periodDays=period;result.rowsStart=rows[0].timestamp;result.rowsEnd=rows.at(-1).timestamp;render(result,series);if(depth==='full')openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date});else if(depth==='advanced')openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date})}catch(error){console.error('[ORACULUM ANALYSIS]',error);$('#analysis-status').textContent='ERRO';$('#analysis-results').innerHTML='<div class="analysis-diagnostics"><p>'+error.message+'</p></div>';$('#analysis-results').classList.remove('is-hidden')}}
 const button=$('#analyze-assets');button?.addEventListener('click',run);$('#full-analysis')?.addEventListener('click',()=>openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date}));
 const onResize=()=>{if(state.rows?.length){const selected=state.selected.map(k=>({...assets[k],key:k})).filter(Boolean);renderChart(state.rows,selected);renderMarkerTimeline()}};window.addEventListener('resize',onResize);return{run,destroy(){window.removeEventListener('resize',onResize)}};
}