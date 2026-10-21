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
import {nearestTimelineIndex,timelineWindow,shiftTimelineWindow,resizeTimelineWindow,resizeTimelineDuration,timelineAssetKeys} from './timeline-state.js';

export function attachComparisonAnalysis({dataClient,normalizeCandles,getCandles,getInterval,getActiveSymbol,assets}){
 wireMetricHelp(document);
 const $=s=>document.querySelector(s),state={rows:null,result:null,selected:[],series:[],assetPool:[],assetCatalog:[],timelineRows:{},commonSeries:[],timelineSlots:[],markers:{start:0,base:0,end:0},interval:'1d',independentTimelines:false,timelineMode:'common',addAssetKey:''};
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const markerDate=(rows,i)=>rows[i]?date(rows[i].timestamp):'—';
 const assetColor=(assetKey,indexOverride)=>{const palette=['#3984ff','#f5a742','#35c780','#8b5cf6','#e0528d','#17a2b8','#f97316','#a3a3a3'];const found=indexOverride??state.timelineSlots.findIndex(slot=>slot.assetKey===assetKey);return palette[Math.max(0,found)%palette.length]};
 const timelineRowsFor=slot=>Array.isArray(slot?.timelineRows)?slot.timelineRows:[];
 const rowsInWindow=slot=>{
   const w=slot?.window,rows=timelineRowsFor(slot);
   if(!w?.valid)return [];
   const start=Math.max(0,Number(w.startIndex)||0),end=Math.min(rows.length-1,Number(w.endIndex)||0);
   return rows.slice(start,end+1);
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
 const sharedRows=()=>state.timelineSlots.length>1
   ?alignSeries(state.timelineSlots.map(slot=>({...slot,key:slot.key})),state.interval)
   :timelineRowsFor(state.timelineSlots[0]);
 const setCommonWindow=(startIndex,count)=>{
   const slots=state.timelineSlots,common=sharedRows();
   if(!slots.length||!common.length)return;
   const size=Math.min(common.length,Math.max(10,Math.floor(count||common.length)));
   const start=clamp(Math.floor(startIndex||0),0,Math.max(0,common.length-size));
   const startKey=periodKeyFor(common[start]),endKey=periodKeyFor(common[start+size-1]);
   for(const slot of slots){
     const rows=timelineRowsFor(slot);
     const a=rows.findIndex(row=>periodKeyFor(row)===startKey),b=rows.findIndex(row=>periodKeyFor(row)===endKey);
     slot.window=a>=0&&b>=a?timelineWindow(rows,a,b,10):timelineWindow([],0,0,10);
   }
 };
 const syncComparisonDurations=()=>{
   const slots=state.timelineSlots,primary=slots[0];
   if(!primary?.window?.valid)return;
   for(const slot of slots.slice(1)){
     const rows=timelineRowsFor(slot);
     const aligned=startWindow(slot,primary.window.start,primary.window.end,10);
     slot.window=resizeTimelineDuration(rows,aligned,primary.window.durationMs,10);
   }
 };
 const alignAllTimelines=()=>{
   syncComparisonDurations();
   renderTimelinePanel();renderChart();recomputeTimelineAnalysis();
 };
 const renderTimelineControls=()=>{
   const host=$('#comparison-timeline-controls');
   if(!host)return;
   const options=Object.entries(assets).map(([key,meta])=>'<option value="'+key+'">'+(meta.symbol||key)+' · '+(meta.name||key)+'</option>').join('');
   host.innerHTML='<button type="button" id="cmp-align-all" class="cmp-mode-toggle" title="Alinhar todas as timelines ao período principal">↔ Alinhar todas</button><label class="cmp-add-picker"><span>Adicionar série</span><select id="cmp-add-asset" aria-label="Selecionar ativo para adicionar"><option value="">＋ Adicionar ativo…</option>'+options+'</select></label>';
   const picker=host.querySelector('#cmp-add-asset');
   if(picker)picker.value='';
   picker?.addEventListener('change',()=>{const key=picker.value;if(key)addTimeline(key);});
   host.querySelector('#cmp-align-all')?.addEventListener('click',alignAllTimelines);
 };
 const renderTimelinePanel=()=>{
   const host=$('#comparison-timelines');
   if(!host||!state.timelineSlots.length)return;
   const referenceRows=timelineRowsFor(state.timelineSlots[0]);
   host.innerHTML=state.timelineSlots.map((slot,i)=>{
     const w=slot.window,color=assetColor(slot.assetKey,i);
     const startIndex=w?.valid?nearestTimelineIndex(referenceRows,w.start):0;
     const endIndex=w?.valid?nearestTimelineIndex(referenceRows,w.end):Math.max(0,referenceRows.length-1);
     const left=w?.valid?clamp(startIndex/Math.max(1,referenceRows.length-1)*100,0,100):0;
     const right=w?.valid?clamp(endIndex/Math.max(1,referenceRows.length-1)*100,0,100):100;
     const days=Math.max(1,Math.round((Number(w?.durationMs)||0)/86400000)+1);
     const durationLabel=days>=1?days+' '+(days===1?'dia':'dias'):(w?.observations||0)+' candles';
     const label=slot.symbol||slot.name||slot.assetKey;
     const intervalLabel=w?.valid?date(w.start)+' — '+date(w.end)+' · '+durationLabel:'Período indisponível';
     const range='<div class="cmp-timeline-range" data-slot="'+i+'" style="--timeline-color:'+color+';left:'+left+'%;width:'+Math.max(1,right-left)+'%" role="slider" aria-label="Mover janela de '+label+'" aria-valuetext="'+intervalLabel+'" tabindex="0"></div>';
     const handles=i===0?'<button type="button" class="cmp-timeline-handle start" data-slot="0" data-edge="start" style="left:'+left+'%" aria-label="Ajustar data inicial do ativo principal" title="Data inicial"></button><button type="button" class="cmp-timeline-handle end" data-slot="0" data-edge="end" style="left:'+right+'%" aria-label="Ajustar data final do ativo principal" title="Data final"></button>':'';
     return '<section class="cmp-timeline-row" data-timeline-row="'+i+'" style="--timeline-color:'+color+'" aria-label="Linha temporal '+(i+1)+'"><div class="cmp-timeline-head"><div class="cmp-timeline-title"><span class="cmp-timeline-color" aria-hidden="true"></span><strong>'+label+'</strong><span class="cmp-timeline-period">'+intervalLabel+'</span></div>'+(i>0?'<button type="button" class="cmp-timeline-remove" data-slot="'+i+'" aria-label="Remover linha temporal '+(i+1)+'" title="Remover">×</button>':'')+'</div><div class="cmp-timeline-track" data-track="'+i+'"><div class="cmp-timeline-rail"></div>'+range+handles+'</div></section>';
   }).join('');
   host.querySelectorAll('.cmp-timeline-remove').forEach(button=>button.addEventListener('click',()=>removeTimeline(Number(button.dataset.slot))));
   host.querySelectorAll('.cmp-timeline-range').forEach(range=>{
     range.addEventListener('pointerdown',event=>beginTimelineDrag(event,Number(range.dataset.slot)));
     range.addEventListener('keydown',event=>{
       if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
       event.preventDefault();shiftTimelineByPeriods(Number(range.dataset.slot),event.key==='ArrowRight'?1:-1);renderTimelinePanel();renderChart();recomputeTimelineAnalysis();
     });
   });
   host.querySelectorAll('.cmp-timeline-handle').forEach(handle=>{
     handle.addEventListener('pointerdown',event=>beginTimelineResize(event,handle.dataset.edge));
   });
 };
 const shiftTimelineByPeriods=(index,steps)=>{
   const slot=state.timelineSlots[index];if(!slot?.window?.valid)return;
   const rows=timelineRowsFor(slot),count=slot.window.endIndex-slot.window.startIndex+1;
   const start=clamp(slot.window.startIndex+steps,0,Math.max(0,rows.length-count));
   slot.window=timelineWindow(rows,start,start+count-1,10);
 };
 const beginTimelineDrag=(event,index)=>{
   event.preventDefault();
   const slot=state.timelineSlots[index];if(!slot?.window?.valid)return;
   const startX=event.clientX,track=event.currentTarget.closest('.cmp-timeline-track'),rect=track.getBoundingClientRect();
   const rows=timelineRowsFor(slot),count=slot.window.endIndex-slot.window.startIndex+1,baseStart=slot.window.startIndex;
   const maxStart=Math.max(0,rows.length-count);
   const move=ev=>{
     const deltaSteps=Math.round((ev.clientX-startX)/Math.max(1,rect.width)*Math.max(1,maxStart));
     const start=clamp(baseStart+deltaSteps,0,maxStart);
     slot.window=timelineWindow(rows,start,start+count-1,10);
     renderTimelinePanel();renderChart();
   };
   const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);recomputeTimelineAnalysis()};
   window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
 };
 const beginTimelineResize=(event,edge)=>{
   event.preventDefault();event.stopPropagation();
   const slot=state.timelineSlots[0];if(!slot?.window?.valid)return;
   const rows=timelineRowsFor(slot),original=slot.window;
   const track=event.currentTarget.closest('.cmp-timeline-track'),rect=track.getBoundingClientRect(),startX=event.clientX;
   const historyStart=Number(rows[0]?.timestamp),historyEnd=Number(rows.at(-1)?.timestamp);
   const historySpan=Math.max(1,historyEnd-historyStart);
   const move=ev=>{
     const deltaMs=((ev.clientX-startX)/Math.max(1,rect.width))*historySpan;
     slot.window=resizeTimelineWindow(rows,original,edge,deltaMs,10);
     syncComparisonDurations();
     renderTimelinePanel();renderChart();
   };
   const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);recomputeTimelineAnalysis()};
   window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
 };
 const addTimeline=async(assetKey)=>{
   if(!state.timelineSlots.length)return;
   const meta=assets[assetKey];if(!meta)return;
   let asset=state.assetPool.find(x=>x.assetKey===assetKey);
   try{
     if(!asset){
       const interval=meta.supportedIntervals?.includes(state.interval)?state.interval:(meta.supportedIntervals?.[0]||state.interval);
       const loaded=await dataClient.loadOrPopulate({provider:meta.provider,symbol:meta.providerSymbol||assetKey,kind:meta.kind||'ohlcv',interval,currency:'USD'});
       const candles=normalizeCandles(loaded.candles);
       if(candles.length<10)throw new Error('Poucos dados para '+(meta.symbol||assetKey)+'.');
       asset={key:assetKey,assetKey,symbol:meta.symbol||assetKey,name:meta.name||assetKey,category:meta.category,candles};
       state.assetPool.push(asset);
     }
     state.addAssetKey=assetKey;
     const index=state.timelineSlots.length,main=state.timelineSlots[0],slot=makeSlot(asset,index),rows=timelineRowsFor(slot);
     slot.window=startWindow(slot,main.window.start,main.window.end,10);
     slot.window=resizeTimelineDuration(rows,slot.window,main.window.durationMs,10);
     state.timelineSlots.push(slot);
     renderTimelineControls();renderTimelinePanel();renderChart();recomputeTimelineAnalysis();
   }catch(error){console.error('[ORACULUM TIMELINE ADD]',error);$('#analysis-status').textContent='ERRO AO ADICIONAR';}
 };
 const removeTimeline=index=>{
   if(index<=0||index>=state.timelineSlots.length)return;
   const remaining=state.timelineSlots.filter((_,i)=>i!==index);
   state.timelineSlots=remaining.map((old,i)=>{const slot=makeSlot(state.assetPool.find(x=>x.assetKey===old.assetKey)||old,i);slot.window=old.window;return slot;});
   renderTimelineControls();renderTimelinePanel();renderChart();recomputeTimelineAnalysis();
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
   const polylines=normalized.map(x=>'<polyline points="'+line(x.values)+'" class="cmp-line" style="stroke:'+assetColor(x.slot.assetKey,x.slot.slotIndex)+'"/>').join('');
   host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="Comparação normalizada por tempo relativo; cada janela começa em base 100"><line x1="'+p.l+'" x2="'+p.l+'" y1="'+p.t+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h-p.b)+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h/2)+'" y2="'+(h/2)+'" class="cmp-grid"/>'+polylines+'<text x="'+p.l+'" y="'+(h-8)+'">Início relativo</text><text x="'+(w-p.r)+'" y="'+(h-8)+'" text-anchor="end">Fim relativo</text><text x="'+(p.l+6)+'" y="'+(h/2-6)+'">100 = início de cada janela</text></svg>';
   const legend=$('#comparison-legend');if(legend)legend.innerHTML='';
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
   // A repeated asset is valid for period-to-period comparison, but must not enter a multivariate model twice.
   const modelSeries=windowedSeries.filter((slot,index)=>windowedSeries.findIndex(other=>other.assetKey===slot.assetKey)===index);
   const commonRows=alignSeries(modelSeries,interval),hasCommon=modelSeries.length>=2&&commonRows.length>=10;
   const commonResult=hasCommon?analyzeSeries(commonRows,modelSeries,interval,{returnMode,rollingWindow}):null;
   const individualResults=slots.map(slot=>({slot,result:analyzeSeries(timelineRows[slot.key],[slot],interval,{returnMode,rollingWindow})}));
   const primaryRows=timelineRows[slots[0].key],primaryResult=individualResults[0].result;
   let result;
   if(hasCommon){
     result=commonResult;
     result.relations=commonResult.relations;
     result.explanatoryModel=runExplanatoryModel(commonRows,windowedSeries,{returnMode});
     result.modelDiagnostics=diagnoseModel(result.explanatoryModel);result.modelValidation=validateModelTwoWays(result.explanatoryModel);result.residualValidation=validateResidualDiagnostics(result.explanatoryModel,result.modelDiagnostics);
     state.rows=commonRows;state.commonSeries=modelSeries;state.independentTimelines=!sameWindowDates(slots);
   }else{
     result={...primaryResult,relations:[],temporal:{method:slots.length<2?'single selected series; no cross-series inference requested':'individual selected windows; no common calendar sample with enough observations for cross-series inference',sharedRows:0,firstBucket:null,lastBucket:null,gaps:0},alignedObservations:0};
     result.explanatoryModel={available:false,reason:slots.length<2?'Selecione outra série temporal para comparar ativos.':modelSeries.length<2?'Há apenas um ativo distinto; séries repetidas podem ser comparadas por período, mas não são duplicadas no modelo multivariado.':'As janelas selecionadas não têm pelo menos 10 observações em datas comuns; o modelo multivariado foi omitido para evitar pareamento artificial.'};
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
   result.temporal={...(result.temporal||{}),method:hasCommon?'individual native-window statistics; cross-series inference on shared calendar buckets within selected windows':slots.length<2?'single selected series; no cross-series inference requested':modelSeries.length<2?'only one distinct asset; repeated periods excluded from multivariate inference':'individual selected windows; no valid shared sample for cross-series inference',sharedRows:hasCommon?commonRows.length:0};
   state.result=result;state.markers={start:0,base:0,end:Math.max(0,(state.rows?.length||1)-1)};
   render(result,slots);
 };
 const initializeTimelineSlots=(pool,reference,interval,period)=>{
   state.interval=interval;state.assetPool=pool;state.assetCatalog=Object.entries(assets).map(([key,meta])=>({key,assetKey:key,symbol:meta.symbol||key,name:meta.name||key,category:meta.category}));const mainRows=alignSeries([pool.find(x=>x.assetKey===reference)||pool[0]],interval);
   if(mainRows.length<10)throw new Error('Poucos dados para a timeline principal.');
   let mainStart=mainRows[0].timestamp,mainEnd=mainRows.at(-1).timestamp;
   if(period!=='full'){const days=Number(period);mainStart=Math.max(mainStart,mainEnd-days*86400000);const at=nearestTimelineIndex(mainRows,mainStart);mainStart=mainRows[Math.max(0,at)].timestamp;}
   const selectedKeys=[...new Set([...document.querySelectorAll('.analysis-asset:checked')].map(x=>x.value).filter(x=>x!==reference&&pool.some(a=>a.assetKey===x)))];
   const includeReference=Boolean(document.querySelector('.analysis-asset[value="'+reference+'"]')?.checked);
   const choices=timelineAssetKeys(reference,selectedKeys);
   if(includeReference)choices.push(reference);
   state.timelineMode='common';
   state.timelineSlots=choices.map((key,index)=>{
     const asset=pool.find(x=>x.assetKey===key)||pool[0],slot=makeSlot(asset,index);
     slot.window=startWindow(slot,mainStart,mainEnd,10);return slot;
   });
   syncComparisonDurations(true);
   if(period!=='full'){
     const common=sharedRows(),end=common.at(-1);
     if(end){
       const startLimit=end.timestamp-Number(period)*86400000;
       const wanted=common.find(row=>row.timestamp>=startLimit)||common[0];
       const main=state.timelineSlots[0],rows=timelineRowsFor(main);
       const a=rows.findIndex(row=>periodKeyFor(row)===wanted.__periodKey),b=rows.findIndex(row=>periodKeyFor(row)===end.__periodKey);
       if(a>=0&&b>=a)main.window=timelineWindow(rows,a,b,10);
       syncComparisonDurations(false);
     }
   }
   renderTimelineControls();renderTimelinePanel();
 };

 const renderContext=(result,series)=>{
   const primary=series[0],targets=series.slice(1).map(s=>s.symbol).join(' + ')||'nenhum alvo selecionado';
   const windows=series.map(s=>s.symbol+': '+date(s.window?.start??result.rowsStart)+' → '+date(s.window?.end??result.rowsEnd)).join(' · ');
   const common=result.temporal?.sharedRows??0;
   const relationText=common>=10?'Relações, beta e regressão usam somente buckets de calendário comuns dentro das janelas selecionadas ('+common+' observações).':new Set(series.map(s=>s.assetKey)).size<2?'Há apenas um ativo distinto. Séries repetidas podem ser comparadas por período, mas não são tratadas como ativos independentes em correlações ou regressões.':'As janelas não têm amostra comum suficiente; correlações, beta e regressão ficam indisponíveis para evitar pareamento artificial.';
   $('#analysis-context').innerHTML='<div class="context-row"><div><span>ATIVO INVESTIGADO</span><strong>'+primary.symbol+'</strong></div><div><span>COMPARAÇÕES</span><strong>'+targets+'</strong></div><div><span>PERÍODO PRINCIPAL</span><strong>'+date(result.rowsStart)+' → '+date(result.rowsEnd)+'</strong></div><div><span>INTERVALO</span><strong>'+result.interval+'</strong></div><div><span>OBSERVAÇÕES PRINCIPAIS</span><strong>'+result.observations+'</strong></div></div><div class="context-method"><div><b>JANELAS SELECIONADAS</b><span>'+windows+'</span></div><button id="show-data-table" type="button">'+(common>=10?'VER DADOS COMUNS ↗':'VER DADOS DO ATIVO PRINCIPAL ↗')+'</button><button id="show-method" type="button">MÉTODO ?</button></div><div class="context-note"><b>Desenho científico:</b> as estatísticas individuais usam a janela escolhida para cada série. '+relationText+' A comparação visual usa tempo relativo, normalizando cada janela em 100 no seu primeiro preço; portanto, deslocar uma janela compara épocas diferentes, não retornos simultâneos. Associação não implica causalidade.</div>';
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
     'Período principal: '+auditDate(result.rowsStart)+' a '+auditDate(result.rowsEnd),
     'Janelas selecionadas: '+series.map(x=>x.symbol+' '+auditDate(x.window?.start)+' a '+auditDate(x.window?.end)+' ('+(state.timelineRows[x.key]?.length??0)+' preços)').join(' | '),
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
   if(state.timelineSlots?.length){
     lines.push('Amostras curtas por janela individual; janelas deslocadas não são pareadas artificialmente.');
     for(const s of series){
       const rows=state.timelineRows[s.key]||[];
       if(!rows.length){lines.push(s.symbol+': janela sem dados.');continue}
       const indices=[...new Set([0,1,2,Math.floor((rows.length-1)/2),rows.length-3,rows.length-2,rows.length-1])].filter(i=>i>=0&&i<rows.length).sort((a,b)=>a-b);
       lines.push('',s.symbol+' | '+auditDate(rows[0].timestamp)+' a '+auditDate(rows.at(-1).timestamp)+' | '+rows.length+' preços');
       lines.push('Data | preço | timestamp-fonte UTC');
       for(const i of indices)lines.push(auditDate(rows[i].timestamp)+' | '+auditNumber(rows[i][s.key],8)+' | '+auditTimestamp(rows[i].__sourceTimestamps?.[s.key]??rows[i].timestamp));
     }
   }else if(sampleRows.length){
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
   renderContext(result,series);renderChart();renderTimelineControls();renderTimelinePanel();
   const primary=result.series[series[0].key],relations=result.relations;
   let html=buildConclusion(result,series)+buildMetricEducation(result,series)+'<div class="analysis-section-label">1 · DISTRIBUIÇÃO DOS RETORNOS · '+primary.symbol+'</div><p class="analysis-layer-note">Primeiro, entenda o comportamento típico de cada intervalo. Depois, avance para performance, risco e relações.</p><div class="results-grid">'+metric('Média',pct(primary.mean),'por intervalo','Média dos retornos da amostra. Pode ser influenciada por valores extremos.')+metric('Desvio-padrão',pct(primary.std),'por intervalo','Dispersão dos retornos em torno da média; é a medida básica de volatilidade por intervalo.')+metric('Mediana',pct(primary.median),'por intervalo','Retorno central: metade dos retornos fica abaixo e metade acima.')+metric('Melhor intervalo',pct(primary.best),'maior retorno','Maior retorno observado em uma única observação.')+metric('Pior intervalo',pct(primary.worst),'menor retorno','Menor retorno observado em uma única observação.')+metric('Observações',fmt(primary.returns?.filter(Number.isFinite).length,0),'retornos válidos','Quantidade de retornos válidos; normalmente um a menos que o número de preços.')+'</div><div class="analysis-section-label">2 · PERFORMANCE E RISCO</div><div class="results-grid">'+metric('Retorno acumulado',pct(primary.total),'no período','Variação total do preço entre o primeiro e o último valor.')+metric('CAGR',pct(primary.cagr),'anualizado','Taxa composta anual equivalente ao período analisado.')+metric('Volatilidade',pct(primary.vol),'anualizada','Desvio-padrão dos retornos anualizado; difere do desvio-padrão por intervalo acima.')+metric('Drawdown máximo',pct(primary.drawdown),'queda máxima','Maior perda de um pico até um vale no período.')+metric('Sharpe',fmt(primary.sharpe,3),'risco/retorno','Retorno médio ajustado pela volatilidade; esta versão não desconta taxa livre de risco.')+metric('Sortino',fmt(primary.sortino,3),'risco de queda','Relaciona retorno médio à dispersão negativa, conforme a convenção indicada na ajuda.')+metric('Win rate',pct(primary.winRate),'intervalos positivos','Percentual de retornos positivos.')+metric('ATH','$ '+fmt(primary.ath),'máxima observada','Maior preço observado na janela.')+'</div>';
   if(state.independentTimelines)html+='<div class="analysis-section-label">RESUMO · JANELAS INDIVIDUAIS</div><div class="results-grid">'+series.map(slot=>{const x=result.series[slot.key];return metric(slot.symbol+' · RETORNO',pct(x?.total),'na janela selecionada','Variação entre o primeiro e o último preço da janela '+date(slot.window?.start)+' → '+date(slot.window?.end))+metric(slot.symbol+' · VOL.',pct(x?.vol),'anualizada','Volatilidade calculada apenas na janela individual desta série.')+metric(slot.symbol+' · DRAWDOWN',pct(x?.drawdown),'queda máxima','Maior queda pico-vale dentro da janela selecionada.')}).join('')+'</div>';
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
   $('#analysis-results').innerHTML=html;$('#analysis-results').classList.remove('is-hidden');wireSummaryCopy($('#analysis-results'),{context:$('#analysis-context'),auditText:()=>buildAuditReport(state.result,state.series,state.rows,state.markers)});wireReportButtons($('#analysis-results'),state.result,state.series);$('#full-analysis').classList.remove('is-hidden');$('#advanced-analysis').onclick=()=>openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date});wireMetricHelp($('#analysis-results'));document.querySelector('#show-data-table')?.addEventListener('click',()=>{const tableAssets={...assets};for(const slot of state.commonSeries||[])tableAssets[slot.key]=assets[slot.assetKey]||slot;openDataTable({rows:state.rows?.slice(state.markers.start,state.markers.end+1)||[],keys:(state.commonSeries||[]).map(slot=>slot.key),assets:tableAssets,fmt,date})});document.querySelector('#show-method')?.addEventListener('click',()=>openInfo('MÉTODO'));
 };

 async function run(){
   const activeSymbol=getActiveSymbol(),reference=document.querySelector('#analysis-reference')?.value||activeSymbol,checked=[...document.querySelectorAll('.analysis-asset:checked')].map(x=>x.value),symbols=[...new Set([reference,...checked])];
   $('#analysis-status').textContent='ANALISANDO';$('#analysis-results').classList.add('is-hidden');$('#full-analysis').classList.add('is-hidden');$('#comparison-panel').classList.add('is-hidden');$('#analysis-context').classList.add('is-hidden');
   try{
     const requestedInterval=getInterval()||'1d',hasDailySeries=symbols.some(key=>assets[key]?.supportedIntervals),interval=hasDailySeries?'1d':requestedInterval,period=$('#analysis-period')?.value||'full',pool=[];
     for(const key of symbols){
       const meta=assets[key];if(!meta)continue;
       const sameLoadedAsset=key===activeSymbol&&interval===requestedInterval;
       const loaded=sameLoadedAsset?{candles:getCandles()}:await dataClient.loadOrPopulate({provider:meta.provider,symbol:meta.providerSymbol||key,kind:meta.kind||'ohlcv',interval:meta.supportedIntervals?.includes(interval)?interval:(meta.supportedIntervals?.[0]||interval),currency:'USD'});
       const candles=normalizeCandles(loaded.candles);
       if(candles.length<10)throw new Error('Poucos dados para '+meta.symbol+'.');
       pool.push({key,assetKey:key,symbol:meta.symbol,name:meta.name,category:meta.category,candles});
     }
     if(!pool.some(x=>x.assetKey===reference))throw new Error('Não foi possível carregar o ativo principal.');
     initializeTimelineSlots(pool,reference,interval,period);
     recomputeTimelineAnalysis();
     const depth=$('#analysis-depth')?.value||'key';
     if(state.result&&depth==='full')openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date});
     else if(state.result&&depth==='advanced')openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date});
   }catch(error){console.error('[ORACULUM ANALYSIS]',error);$('#analysis-status').textContent='ERRO';$('#analysis-results').innerHTML='<div class="analysis-diagnostics"><p>'+error.message+'</p></div>';$('#analysis-results').classList.remove('is-hidden')}
 }
 const button=$('#analyze-assets');button?.addEventListener('click',run);$('#full-analysis')?.addEventListener('click',()=>openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date}));
 const onResize=()=>{if(state.timelineSlots?.length){renderChart();renderTimelinePanel()}};window.addEventListener('resize',onResize);return{run,destroy(){window.removeEventListener('resize',onResize)}};
}