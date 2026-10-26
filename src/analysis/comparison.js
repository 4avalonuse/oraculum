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
import {buildScientificReading} from './scientific-reading.js';
import {nearestTimelineIndex,timelineWindow,shiftTimelineWindow,resizeTimelineWindow,resizeTimelineDuration,timelineAssetKeys} from './timeline-state.js';
import {ScientificStatus,inspectWindowSamples,inspectCalendarInference} from './validation/sample-quality.js';
import {activeTimelineSlots,toggleTimelineActive} from './timeline-activation.js';
import {comparisonPlotSeries,activePlotSeries} from './timeline-plot-series.js';

export function attachComparisonAnalysis({dataClient,normalizeCandles,getCandles,getInterval,getActiveSymbol,assets}){
 wireMetricHelp(document);
 const $=s=>document.querySelector(s),state={rows:null,result:null,selected:[],series:[],assetPool:[],assetCatalog:[],timelineRows:{},commonSeries:[],timelineSlots:[],markers:{start:0,base:0,end:0},interval:'1d',independentTimelines:false,timelineMode:'common',addAssetKey:'',prepared:false};
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const markTimelinesChanged=()=>{
   $('#analysis-results')?.classList.add('is-hidden');
   $('#full-analysis')?.classList.add('is-hidden');
   const status=$('#analysis-status');
   if(status)status.textContent='JANELAS ATUALIZADAS · ANALISE PARA CALCULAR';
   const button=$('#analyze-assets');
   if(button)button.textContent='ANALISAR JANELAS ↗';
 };

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
   const slot={...asset,key:'timeline-'+index,assetKey:asset.assetKey||asset.key,slotIndex:index,active:true};
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
   const slots=state.timelineSlots,primary=slots[0],common=sharedRows();
   if(!primary?.window?.valid||!common.length)return;
   const first=Number(common[0].timestamp),last=Number(common.at(-1).timestamp);
   const startTime=clamp(Number(primary.window.start),first,last),endTime=clamp(Number(primary.window.end),first,last);
   const a=nearestTimelineIndex(common,startTime),b=nearestTimelineIndex(common,endTime);
   const startIndex=Math.min(a,b),endIndex=Math.max(a,b),frameCount=endIndex-startIndex+1;
   const start=Number(common[startIndex].timestamp),end=Number(common[endIndex].timestamp);
   for(const slot of slots){
     const rows=timelineRowsFor(slot);
     const from=nearestTimelineIndex(rows,start),to=nearestTimelineIndex(rows,end);
     if(from>=0&&to>=from)slot.window=timelineWindow(rows,from,to,Math.min(10,frameCount));
   }
 };
 const alignmentModes=['calendar','start'];
 let alignmentMode='calendar';
 const alignAllTimelines=()=>{
   alignmentMode=alignmentModes[(alignmentModes.indexOf(alignmentMode)+1)%alignmentModes.length];
   renderTimelineControls();renderTimelinePanel();renderChart();markTimelinesChanged();
 };
 const visibleTimelineLayout=()=>{
   const common=sharedRows(),capacity=Math.max(1,common.length-1);
   let offset=0;
   return state.timelineSlots.map(slot=>{
     const rows=rowsInWindow(slot),first=rows[0],last=rows.at(-1);
     const start=first?Math.max(0,nearestTimelineIndex(common,first.timestamp)):0;
     const end=last?Math.max(start,nearestTimelineIndex(common,last.timestamp)):start;
     const duration=rows.length;
     const position=alignmentMode==='start'?0:alignmentMode==='sequential'?offset:start;
     if(alignmentMode==='sequential')offset+=duration;
     const visibleCount=Math.max(0,Math.min(duration,capacity-position));
     return {position,duration,capacity,visibleCount,rows:rows.slice(0,visibleCount),incomplete:visibleCount<duration};
   });
 };
 const categoryLabels={crypto:'Cripto',stock:'Ações',index:'Índices',commodity:'Commodities',rates:'Juros', 'btc-etf':'ETFs',test:'Validação'};
 const addCatalogAsset=async(assetKey)=>{
   const meta=assets[assetKey];if(!meta)return;
   const status=$('#analysis-status');
   try{
     let asset=state.assetPool.find(item=>item.assetKey===assetKey);
     if(!asset){
       if(meta.supportedIntervals?.length&&!meta.supportedIntervals.includes(state.interval)){
         if(status)status.textContent='ESTE ATIVO USA DADOS DIÁRIOS — execute novamente a análise em D1 para adicioná-lo.';
         return;
       }
       if(status)status.textContent='CARREGANDO '+(meta.symbol||assetKey);
       const loaded=await dataClient.loadOrPopulate({provider:meta.provider,symbol:meta.providerSymbol||assetKey,kind:meta.kind||'ohlcv',interval:meta.supportedIntervals?.includes(state.interval)?state.interval:(meta.supportedIntervals?.[0]||state.interval),currency:'USD'});
       const candles=normalizeCandles(loaded.candles);
       if(candles.length<10)throw new Error('Poucos dados disponíveis para '+(meta.symbol||assetKey)+'.');
       asset={key:assetKey,assetKey,symbol:meta.symbol||assetKey,name:meta.name||assetKey,category:meta.category,candles};
       state.assetPool.push(asset);
     }
     const slot=makeSlot(asset,state.timelineSlots.length);
     const primary=state.timelineSlots[0];
     slot.window=startWindow(slot,primary?.window?.start??timelineRowsFor(slot)[0]?.timestamp,primary?.window?.end??timelineRowsFor(slot).at(-1)?.timestamp,10);
     state.timelineSlots.push(slot);
     syncComparisonDurations();
     renderTimelineControls();renderTimelinePanel();renderChart();markTimelinesChanged();
   }catch(error){
     console.error('[ORACULUM ADD ASSET]',error);
     if(status)status.textContent='NÃO FOI POSSÍVEL ADICIONAR '+(meta.symbol||assetKey);
   }
 };
 const renderTimelineControls=()=>{
   const host=$('#comparison-timeline-controls');
   if(!host)return;
   const categories={};
   state.assetCatalog.forEach(asset=>{const category=asset.category||'other';(categories[category]||(categories[category]=[])).push(asset)});
   const menu=Object.entries(categories).map(([category,list])=>'<details class="cmp-add-category"><summary>'+ (categoryLabels[category]||category) +'<span>'+list.length+'</span></summary><div class="cmp-add-category-list">'+list.map(asset=>'<div class="cmp-add-option"><span><strong>'+asset.symbol+'</strong><small>'+asset.name+'</small></span><button type="button" class="cmp-add-series" data-add-asset="'+asset.assetKey+'" aria-label="Adicionar '+asset.symbol+'" title="Adicionar '+asset.name+'">+</button></div>').join('')+'</div></details>').join('');
   host.innerHTML='<button type="button" id="cmp-add-toggle" class="cmp-mode-toggle" aria-expanded="false">＋ Adicionar ativo</button><button type="button" id="cmp-align-all" class="cmp-mode-toggle" title="Alternar entre comparação relativa e calendário">↔ '+({calendar:"Calendário",start:"Comparação relativa"}[alignmentMode])+'</button><div id="cmp-add-menu" class="cmp-add-menu" hidden><div class="cmp-add-menu-head"><strong>ADICIONAR À INVESTIGAÇÃO</strong><small>Toque em + para criar uma nova timeline. Repetir ativos é permitido.</small></div>'+menu+'</div>';
   const toggle=host.querySelector('#cmp-add-toggle'),panel=host.querySelector('#cmp-add-menu');
   toggle?.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));});
   host.querySelector('#cmp-align-all')?.addEventListener('click',alignAllTimelines);
   host.querySelectorAll('[data-add-asset]').forEach(button=>button.addEventListener('click',()=>addCatalogAsset(button.dataset.addAsset)));
 };
 const renderTimelinePanel=()=>{
   const host=$('#comparison-timelines');
   if(!host||!state.timelineSlots.length)return;
   const common=sharedRows();
   const commonStart=Number(common[0]?.timestamp)||0,commonEnd=Number(common.at(-1)?.timestamp)||commonStart;
   const commonSpan=Math.max(1,common.length-1),layouts=visibleTimelineLayout();
   host.innerHTML=state.timelineSlots.map((slot,i)=>{
     const w=slot.window,color=assetColor(slot.assetKey,i);
     // Each track is measured in the same shared frames, never in each asset's full native history.
     const layout=layouts[i];
     const left=clamp(layout.position/commonSpan*100,0,100);
     const right=clamp((layout.position+layout.visibleCount)/commonSpan*100,0,100);
     const incomplete=layout.incomplete;
     const visible=layout.visibleCount>0;
     const days=Math.max(1,Math.round((Number(w?.durationMs)||0)/86400000)+1);
     const durationLabel=days>=1?days+' '+(days===1?'dia':'dias'):(w?.observations||0)+' candles';
     const label=(slot.symbol||slot.name||slot.assetKey)+' · Janela '+(i+1);
     const intervalLabel=w?.valid?date(w.start)+' — '+date(w.end)+' · '+durationLabel:'Período indisponível';
     const range=visible?'<div class="cmp-timeline-range" data-slot="'+i+'" style="--timeline-color:'+color+';left:'+left+'%;width:'+Math.max(0,right-left)+'%" role="slider" aria-label="Mover janela de '+label+'" aria-valuetext="'+intervalLabel+'" tabindex="0" title="'+(incomplete?'Janela parcialmente visível; duração preservada':'Janela completa')+'"></div>': '<span class="cmp-timeline-duration" title="Janela fora da área visível">↗ Continua fora da escala</span>';
     const handles=i===0?'<button type="button" class="cmp-timeline-handle handle-start" data-slot="0" data-edge="start" style="left:clamp(12px,'+left+'%,calc(100% - 12px))" aria-label="Ajustar data inicial do ativo principal" title="Arraste para ajustar o início"></button><button type="button" class="cmp-timeline-handle handle-end" data-slot="0" data-edge="end" style="left:clamp(12px,'+right+'%,calc(100% - 12px))" aria-label="Ajustar data final do ativo principal" title="Arraste para ajustar o fim"></button>':'';
     return '<section class="cmp-timeline-row" data-timeline-row="'+i+'" style="--timeline-color:'+color+';opacity:'+(slot.active===false?'0.45':'1')+'" aria-label="Linha temporal '+(i+1)+'"><div class="cmp-timeline-head"><div class="cmp-timeline-title"><span class="cmp-timeline-color" aria-hidden="true"></span><strong>'+label+'</strong></div><button type="button" class="cmp-mode-toggle cmp-timeline-active" data-active-slot="'+i+'" aria-pressed="'+(slot.active!==false)+'" '+(i===0?'disabled title="A referência principal permanece ativa"':'title="Alternar participação desta timeline na análise"')+'>'+(slot.active===false?'○ Referência':'● Ativa')+'</button><button type="button" class="cmp-mode-toggle" data-duplicate-slot="'+i+'" title="Duplicar ativo em nova janela" aria-label="Duplicar '+label+'">↓</button><button type="button" class="cmp-mode-toggle" data-remove-slot="'+i+'" '+(state.timelineSlots.length===1?'disabled ':'')+'title="Remover janela" aria-label="Remover '+label+'">×</button></div><div class="cmp-timeline-track" data-track="'+i+'"><div class="cmp-timeline-rail"></div>'+range+handles+'</div><div class="cmp-timeline-dates" aria-label="'+intervalLabel+'"><span>'+ (w?.valid?date(w.start):'—') +'</span><span class="cmp-timeline-duration">'+(w?.valid?durationLabel:'')+'</span><span>'+ (w?.valid?date(w.end):'—') +'</span></div></section>';
   }).join('');
   host.querySelectorAll('[data-duplicate-slot]').forEach(button=>button.addEventListener('click',()=>{
     const original=state.timelineSlots[Number(button.dataset.duplicateSlot)];
     if(!original)return;
     const duplicate={...original,key:'timeline-'+Date.now()+'-'+state.timelineSlots.length,slotIndex:state.timelineSlots.length,active:true,window:{...original.window}};
     state.timelineSlots.push(duplicate);
     renderTimelinePanel();renderChart();markTimelinesChanged();
   }));
   host.querySelectorAll('[data-remove-slot]').forEach(button=>button.addEventListener('click',()=>{
     if(state.timelineSlots.length<=1)return;
     state.timelineSlots.splice(Number(button.dataset.removeSlot),1);
     state.timelineSlots.forEach((slot,index)=>{slot.slotIndex=index;if(index===0)slot.active=true;});
     renderTimelinePanel();renderChart();markTimelinesChanged();
   }));
   host.querySelectorAll('[data-active-slot]').forEach(button=>button.addEventListener('click',()=>{
     const index=Number(button.dataset.activeSlot);
     state.timelineSlots=toggleTimelineActive(state.timelineSlots,index);
     renderTimelinePanel();renderChart();markTimelinesChanged();
   }));
   host.querySelectorAll('.cmp-timeline-range').forEach(range=>{
     range.addEventListener('pointerdown',event=>beginTimelineDrag(event,Number(range.dataset.slot)));
     range.addEventListener('keydown',event=>{
       if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
       event.preventDefault();shiftTimelineByPeriods(Number(range.dataset.slot),event.key==='ArrowRight'?1:-1);renderTimelinePanel();renderChart();markTimelinesChanged();
     });
   });
   host.querySelectorAll('.cmp-timeline-handle').forEach(handle=>{
     handle.addEventListener('pointerdown',event=>beginTimelineResize(event,handle.dataset.edge));
   });
 };
 const shiftTimelineByPeriods=(index,steps)=>{
   const slot=state.timelineSlots[index],common=sharedRows();if(!slot?.window?.valid||!common.length)return;
   const startFrame=nearestTimelineIndex(common,slot.window.start),endFrame=nearestTimelineIndex(common,slot.window.end);
   const count=Math.max(10,endFrame-startFrame+1),start=clamp(startFrame+steps,0,Math.max(0,common.length-count));
   const rows=timelineRowsFor(slot),from=nearestTimelineIndex(rows,common[start].timestamp),to=nearestTimelineIndex(rows,common[Math.min(common.length-1,start+count-1)].timestamp);
   if(from>=0&&to>=from)slot.window=timelineWindow(rows,from,to,10);
 };
 const beginTimelineDrag=(event,index)=>{
   event.preventDefault();
   const slot=state.timelineSlots[index];if(!slot?.window?.valid)return;
   const startX=event.clientX,track=event.currentTarget.closest('.cmp-timeline-track'),rect=track.getBoundingClientRect(),common=sharedRows();
   const rows=timelineRowsFor(slot),baseStart=nearestTimelineIndex(common,slot.window.start),baseEnd=nearestTimelineIndex(common,slot.window.end);
   const count=Math.max(10,baseEnd-baseStart+1),maxStart=Math.max(0,common.length-count);
   const move=ev=>{
     const deltaSteps=Math.round((ev.clientX-startX)/Math.max(1,rect.width)*Math.max(1,common.length-1));
     const start=clamp(baseStart+deltaSteps,0,maxStart),from=nearestTimelineIndex(rows,common[start].timestamp),to=nearestTimelineIndex(rows,common[Math.min(common.length-1,start+count-1)].timestamp);
     if(from>=0&&to>=from)slot.window=timelineWindow(rows,from,to,10);
     renderTimelinePanel();renderChart();
   };
   const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);markTimelinesChanged()};
   window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
 };
 const beginTimelineResize=(event,edge)=>{
   event.preventDefault();event.stopPropagation();
   const slot=state.timelineSlots[0],common=sharedRows();if(!slot?.window?.valid||common.length<10)return;
   const rows=timelineRowsFor(slot),original=slot.window;
   const track=event.currentTarget.closest('.cmp-timeline-track'),rect=track.getBoundingClientRect(),startX=event.clientX;
   const baseStart=nearestTimelineIndex(common,original.start),baseEnd=nearestTimelineIndex(common,original.end);
   const move=ev=>{
     const deltaFrames=Math.round(((ev.clientX-startX)/Math.max(1,rect.width))*(common.length-1));
     const startFrame=clamp(edge==='start'?baseStart+deltaFrames:baseStart,0,common.length-1);
     const endFrame=clamp(edge==='end'?baseEnd+deltaFrames:baseEnd,0,common.length-1);
     const minFrames=10;
     let a=Math.min(startFrame,endFrame),b=Math.max(startFrame,endFrame);
     if(b-a+1<minFrames){if(edge==='start')a=Math.max(0,b-minFrames+1);else b=Math.min(common.length-1,a+minFrames-1);}
     const from=nearestTimelineIndex(rows,common[a].timestamp),to=nearestTimelineIndex(rows,common[b].timestamp);
     if(from>=0&&to>=from)slot.window=timelineWindow(rows,from,to,10);
     syncComparisonDurations();
     renderTimelinePanel();renderChart();
   };
   const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);markTimelinesChanged()};
   window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
 };
 const renderChart=()=>{
   const host=$('#comparison-chart');if(!host||!state.timelineSlots.length)return;
   const w=Math.max(320,host.clientWidth||800),h=280,p={l:48,r:18,t:20,b:34};
   const layouts=visibleTimelineLayout();
   const plotted=comparisonPlotSeries(state.timelineSlots,slot=>layouts[slot.slotIndex]?.rows||[]);
   if(!plotted.length){host.innerHTML='<p class="analysis-layer-note">Não há observações suficientes para desenhar a comparação.</p>';return}
   const normalized=plotted.map(({slot,rows,reference})=>({slot,rows,reference,position:layouts[slot.slotIndex]?.position||0,values:rows.map(r=>100*Number(r[slot.key])/Number(rows[0][slot.key]))})).filter(x=>x.values.every(v=>Number.isFinite(v)&&v>0));
   const all=activePlotSeries(normalized).flatMap(x=>x.values);if(!all.length){host.innerHTML='<p class="analysis-layer-note">Preços inválidos para normalização em base 100.</p>';return}
   const lo=Math.log(Math.min(...all)),hi=Math.log(Math.max(...all));
   const line=(values,position)=>values.map((v,i)=>{const x=p.l+((position+i)/Math.max(1,layouts[0]?.capacity||1))*(w-p.l-p.r),y=h-p.b-(Math.log(Math.max(.0001,v))-lo)/(hi-lo||1)*(h-p.t-p.b);return x.toFixed(2)+','+y.toFixed(2)}).join(' ');
   const polylines=normalized.map(x=>'<polyline points="'+line(x.values,x.position)+'" class="cmp-line" style="stroke:'+assetColor(x.slot.assetKey,x.slot.slotIndex)+';opacity:'+(x.reference?'0.27':'1')+';stroke-dasharray:'+(x.reference?'5 6':'none')+'"/>').join('');
   host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="Comparação normalizada por tempo relativo; cada janela começa em base 100"><line x1="'+p.l+'" x2="'+p.l+'" y1="'+p.t+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h-p.b)+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h/2)+'" y2="'+(h/2)+'" class="cmp-grid"/>'+polylines+'<text x="'+p.l+'" y="'+(h-8)+'">Início relativo</text><text x="'+(w-p.r)+'" y="'+(h-8)+'" text-anchor="end">Fim relativo</text><text x="'+(p.l+6)+'" y="'+(h/2-6)+'">100 = início de cada janela</text></svg>';
   const legend=$('#comparison-legend');if(legend)legend.innerHTML=normalized.map(({slot,rows})=>'<span class="cmp-series-label"><span aria-hidden="true" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+assetColor(slot.assetKey,slot.slotIndex)+';margin-right:6px"></span>'+(slot.symbol||slot.name||slot.assetKey)+' · Janela '+(slot.slotIndex+1)+(normalized.find(x=>x.slot===slot)?.reference?' · referência (fora da análise)':' · ativa')+' ('+date(rows[0].timestamp)+' → '+date(rows.at(-1).timestamp)+')</span>').join(' · ');
 };
 const sameWindowDates=slots=>slots.every(slot=>{
   const rows=rowsInWindow(slot),first=rows[0],last=rows.at(-1),main=rowsInWindow(slots[0]);
   return first&&last&&main[0]&&main.at(-1)&&periodKeyFor(first)===periodKeyFor(main[0])&&periodKeyFor(last)===periodKeyFor(main.at(-1));
 });
 const recomputeTimelineAnalysis=()=>{
   if(!state.timelineSlots.length)return;
   const returnMode=$('#analysis-return')?.value||'log',rollingWindow=Number($('#analysis-window')?.value||30),interval=state.interval||'1d',slots=activeTimelineSlots(state.timelineSlots);
   const layouts=visibleTimelineLayout();
   const timelineRows=Object.fromEntries(slots.map(slot=>[slot.key,layouts[slot.slotIndex]?.rows||[]]));
   const sampleCheck=inspectWindowSamples(slots.map(slot=>timelineRows[slot.key]));
   if(sampleCheck.status===ScientificStatus.BLOCKED){
     const issue=sampleCheck.issues[0];
     const messages={INSUFFICIENT_SAMPLE:'AMOSTRA INSUFICIENTE',FRAME_COUNT_MISMATCH:'FRAMES DESIGUAIS · AJUSTE AS JANELAS',INVALID_TIME_ORDER:'DATAS INVÁLIDAS · REVISE OS DADOS',NO_WINDOWS:'NENHUMA JANELA SELECIONADA'};
     $('#analysis-status').textContent=messages[issue?.code]||'AMOSTRA INVÁLIDA';
     return;
   }
   state.timelineRows=timelineRows;state.series=slots;state.selected=slots.map(slot=>slot.key);
   const windowedSeries=slots.map(slot=>{const rows=timelineRows[slot.key];return {...slot,candles:slot.candles.filter(c=>rows.some(row=>Number(row.timestamp)===Number(c.timestamp)))};});
   // A repeated asset is valid for period-to-period comparison, but must not enter a multivariate model twice.
   const modelSeries=windowedSeries.filter((slot,index)=>windowedSeries.findIndex(other=>other.assetKey===slot.assetKey)===index);
   const commonRows=alignSeries(modelSeries,interval),calendarCheck=inspectCalendarInference({seriesCount:modelSeries.length,alignedRows:commonRows}),hasCommon=alignmentMode==='calendar'&&calendarCheck.status===ScientificStatus.APPROVED;
   const commonResult=hasCommon?analyzeSeries(commonRows,modelSeries,interval,{returnMode,rollingWindow}):null;
   const individualResults=slots.map(slot=>({slot,result:analyzeSeries(timelineRows[slot.key],[slot],interval,{returnMode,rollingWindow})}));
   const primaryRows=timelineRows[slots[0].key],primaryResult=individualResults[0].result;
   let result;
   if(hasCommon){
     result=commonResult;
     result.relations=commonResult.relations;
     result.explanatoryModel=runExplanatoryModel(commonRows,modelSeries,{returnMode});
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
   result.timelineVisibility=layouts.filter(x=>x.incomplete).map((x,i)=>({visible:x.visibleCount,total:x.duration}));
   result.timelineAlignment=alignmentMode;
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
   let html=buildConclusion(result,series)+'<div class="analysis-section-label">1 · DISTRIBUIÇÃO DOS RETORNOS · '+primary.symbol+'</div><p class="analysis-layer-note">Primeiro, entenda o comportamento típico de cada intervalo. Depois, avance para performance, risco e relações.</p><div class="results-grid">'+metric('Média',pct(primary.mean),'por intervalo','Média dos retornos da amostra. Pode ser influenciada por valores extremos.')+metric('Desvio-padrão',pct(primary.std),'por intervalo','Dispersão dos retornos em torno da média; é a medida básica de volatilidade por intervalo.')+metric('Mediana',pct(primary.median),'por intervalo','Retorno central: metade dos retornos fica abaixo e metade acima.')+metric('Melhor intervalo',pct(primary.best),'maior retorno','Maior retorno observado em uma única observação.')+metric('Pior intervalo',pct(primary.worst),'menor retorno','Menor retorno observado em uma única observação.')+metric('Observações',fmt(primary.returns?.filter(Number.isFinite).length,0),'retornos válidos','Quantidade de retornos válidos; normalmente um a menos que o número de preços.')+'</div><div class="analysis-section-label">2 · PERFORMANCE E RISCO</div><div class="results-grid">'+metric('Retorno acumulado',pct(primary.total),'no período','Variação total do preço entre o primeiro e o último valor.')+metric('CAGR',pct(primary.cagr),'anualizado','Taxa composta anual equivalente ao período analisado.')+metric('Volatilidade',pct(primary.vol),'anualizada','Desvio-padrão dos retornos anualizado; difere do desvio-padrão por intervalo acima.')+metric('Drawdown máximo',pct(primary.drawdown),'queda máxima','Maior perda de um pico até um vale no período.')+metric('Sharpe',fmt(primary.sharpe,3),'risco/retorno','Retorno médio ajustado pela volatilidade; esta versão não desconta taxa livre de risco.')+metric('Sortino',fmt(primary.sortino,3),'risco de queda','Relaciona retorno médio à dispersão negativa, conforme a convenção indicada na ajuda.')+metric('Win rate',pct(primary.winRate),'intervalos positivos','Percentual de retornos positivos.')+metric('ATH','$ '+fmt(primary.ath),'máxima observada','Maior preço observado na janela.')+'</div>';
   if(state.independentTimelines)html+='<div class="analysis-section-label">RESUMO · JANELAS INDIVIDUAIS</div><div class="results-grid">'+series.map(slot=>{const x=result.series[slot.key];return metric(slot.symbol+' · RETORNO',pct(x?.total),'na janela selecionada','Variação entre o primeiro e o último preço da janela '+date(slot.window?.start)+' → '+date(slot.window?.end))+metric(slot.symbol+' · VOL.',pct(x?.vol),'anualizada','Volatilidade calculada apenas na janela individual desta série.')+metric(slot.symbol+' · DRAWDOWN',pct(x?.drawdown),'queda máxima','Maior queda pico-vale dentro da janela selecionada.')}).join('')+'</div>';
   if(relations.length)html+='<div class="analysis-section-label">RELAÇÕES · ATIVO INVESTIGADO × SÉRIES COMPARADAS</div><div class="results-grid">'+relations.map(r=>metric(r.target.toUpperCase()+' · CORR.',fmt(r.correlation,3),'associação','Correlação dos retornos; não implica causalidade.')+metric(r.target.toUpperCase()+' · BETA',fmt(r.beta,3),'sensibilidade','Sensibilidade do alvo em relação à referência.')+metric(r.target.toUpperCase()+' · R²',pct(r.r2),'ajuste linear','Parcela da variação do alvo explicada pelo modelo linear.')+metric(r.target.toUpperCase()+' · LEAD/LAG',String(r.leadLag.lag),'intervalos','Defasagem com maior correlação absoluta testada.')).join('')+'</div>';

   const validation=result.modelValidation||{status:'NOT_CHECKED',passed:0,total:0,checks:[]};
   const validationState=validation.status==='BOTH_PATHS_AGREE'?'consistent':validation.status==='ALERT'?'alert':'pending';
   const validationLabel=validationState==='consistent'?'Conferência numérica consistente':validationState==='alert'?'Divergência numérica — investigar':'Conferência numérica pendente';
   const validationMessage=validation.message||(validationState==='consistent'?'As implementações comparadas produziram resultados compatíveis. Isso não confirma, por si só, a validade econômica do modelo.':validationState==='alert'?'Há uma divergência que precisa ser examinada antes de confiar neste resultado.':'Esta conferência ainda não foi concluída para o modelo atual.');
   const validationAction=validationState==='alert'
     ?'Próximo passo: abra os detalhes, localize as verificações marcadas como FAIL e investigue a divergência antes de interpretar o modelo.'
     :validationState==='pending'
       ?(result.explanatoryModel?.reason||'Próximo passo: confirme se há amostra comum suficiente e se o modelo pôde ser estimado antes de tirar conclusões multivariadas.')
       :'Próximo passo: use a leitura científica para revisar pressupostos, resíduos e limites; concordância numérica não comprova validade econômica.';
   html+='<section class="analysis-validation is-'+validationState+'" role="status" aria-label="Conferência numérica"><div class="analysis-validation__head"><span class="analysis-validation__marker" aria-hidden="true">'+(validationState==='consistent'?'✓':validationState==='alert'?'!':'…')+'</span><div class="analysis-validation__summary"><strong>'+validationLabel+'</strong><span>'+validation.passed+'/'+validation.total+' verificações numéricas</span></div><details class="analysis-validation__details"><summary>Detalhes e limites</summary><p>'+validationMessage+'</p><ul>'+(validation.checks||[]).map(item=>'<li><span class="analysis-validation__check">'+item.status+'</span> · '+item.name+'</li>').join('')+'</ul><small>Esta é uma conferência entre implementações, não um benchmark externo independente. Ela não comprova validade econômica, causalidade nem adequação do modelo.</small></details><p class="analysis-validation__next-step">'+validationAction+' <a href="#scientific-reading-layer">Abrir leitura científica contextual ↗</a></p></div></section>';

   const scientificReading=buildScientificReading(result,{fmt,pct,date});
   if(scientificReading)html+='<details id="scientific-reading-layer" class="scientific-reading-layer"><summary><span><b>INVESTIGAR</b><strong>Leitura científica contextual</strong><small>O que os dados mostram, pressupostos e limites da conclusão</small></span><span class="scientific-reading-layer__symbol" aria-hidden="true">＋</span></summary>'+scientificReading+'</details>';
   html+=buildMetricEducation(result,series);
   html+='<div class="analysis-section-label">AVANÇADO</div><div class="advanced-teaser"><span>Mediana, melhor/pior período, covariância, alpha, correlação móvel e diagnóstico de lead/lag.</span><button id="advanced-analysis">VER ESTATÍSTICAS AVANÇADAS ↗</button></div>';
   const em=result.explanatoryModel;
   if(em?.available){html+='<div class="analysis-section-label">EXPLICAÇÃO MULTIVARIADA · '+primary.symbol+'</div><div class="explanation-teaser"><div><b>PERGUNTA:</b> as variáveis selecionadas ajudam a explicar os retornos do '+primary.symbol+'?</div><strong>R² '+pct(em.r2,2)+' · R² ajustado '+pct(em.adjustedR2,2)+'</strong><small>Modelo linear conjunto sobre retornos alinhados. Associação estatística, não causalidade.</small></div>'}
   else if(series.length>1){html+='<div class="analysis-section-label">EXPLICAÇÃO MULTIVARIADA</div><div class="explanation-teaser is-unavailable"><b>MODELO NÃO ESTIMADO</b><small>'+em.reason+'</small></div>'}
   $('#analysis-results').innerHTML=html;$('#analysis-results').classList.remove('is-hidden');$('#analysis-results').querySelectorAll('[data-science-target]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const layer=$('#scientific-reading-layer'),target=$('#'+link.dataset.scienceTarget);if(layer)layer.open=true;target?.scrollIntoView({behavior:'smooth',block:'start'});if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}}));$('#analysis-results').querySelectorAll('a[href="#scientific-reading-layer"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const layer=$('#scientific-reading-layer');if(layer){layer.open=true;layer.scrollIntoView({behavior:'smooth',block:'start'});}}));wireSummaryCopy($('#analysis-results'),{context:$('#analysis-context'),auditText:()=>buildAuditReport(state.result,state.series,state.rows,state.markers)});wireReportButtons($('#analysis-results'),state.result,state.series);$('#full-analysis').classList.remove('is-hidden');$('#advanced-analysis').onclick=()=>openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date});wireMetricHelp($('#analysis-results'));document.querySelector('#show-data-table')?.addEventListener('click',()=>{const tableAssets={...assets};for(const slot of state.commonSeries||[])tableAssets[slot.key]=assets[slot.assetKey]||slot;openDataTable({rows:state.rows?.slice(state.markers.start,state.markers.end+1)||[],keys:(state.commonSeries||[]).map(slot=>slot.key),assets:tableAssets,fmt,date})});document.querySelector('#show-method')?.addEventListener('click',()=>openInfo('MÉTODO'));
 };

  async function prepare(){
    if(state.prepared)return true;
    const activeSymbol=getActiveSymbol(),reference=document.querySelector('#analysis-reference')?.value||activeSymbol;
    $('#analysis-status').textContent='PREPARANDO TIMELINES';
    $('#analysis-results').classList.add('is-hidden');$('#full-analysis').classList.add('is-hidden');$('#analysis-context').classList.add('is-hidden');
    try{
      const requestedInterval=getInterval()||'1d',meta=assets[reference],interval=meta?.supportedIntervals?.length?meta.supportedIntervals[0]:requestedInterval,period=$('#analysis-period')?.value||'full',pool=[];
      if(!meta)throw new Error('Ativo principal não encontrado no catálogo.');
      const sameLoadedAsset=reference===activeSymbol&&interval===requestedInterval;
      const loaded=sameLoadedAsset?{candles:getCandles()}:await dataClient.loadOrPopulate({provider:meta.provider,symbol:meta.providerSymbol||reference,kind:meta.kind||'ohlcv',interval:meta.supportedIntervals?.includes(interval)?interval:(meta.supportedIntervals?.[0]||interval),currency:'USD'});
      const candles=normalizeCandles(loaded.candles);
      if(candles.length<10)throw new Error('Poucos dados para '+meta.symbol+'.');
      pool.push({key:reference,assetKey:reference,symbol:meta.symbol,name:meta.name,category:meta.category,candles});
      initializeTimelineSlots(pool,reference,interval,period);
      state.prepared=true;
      $('#comparison-panel').classList.remove('is-hidden');
      $('#comparison-period').textContent=date(state.timelineSlots[0]?.window?.start)+' → '+date(state.timelineSlots[0]?.window?.end);
      renderChart();
      $('#analysis-status').textContent='TIMELINES PRONTAS';
      $('#analyze-assets').textContent='ANALISAR JANELAS ↗';
      return true;
    }catch(error){
      console.error('[ORACULUM PREPARE]',error);
      $('#analysis-status').textContent='ERRO AO PREPARAR';
      $('#analysis-results').innerHTML='<div class="analysis-diagnostics"><p>'+error.message+'</p></div>';
      $('#analysis-results').classList.remove('is-hidden');
      return false;
    }
  }
  async function run(){
    if(!state.prepared){
      await prepare();
      return;
    }
    $('#analysis-status').textContent='ANALISANDO JANELAS';
    $('#analysis-results').classList.add('is-hidden');$('#full-analysis').classList.add('is-hidden');$('#analysis-context').classList.add('is-hidden');
    try{
      recomputeTimelineAnalysis();
      const depth=$('#analysis-depth')?.value||'key';
      if(state.result&&depth==='full')openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date});
      else if(state.result&&depth==='advanced')openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date});
    }catch(error){
      console.error('[ORACULUM ANALYSIS]',error);
      $('#analysis-status').textContent='ERRO';
      $('#analysis-results').innerHTML='<div class="analysis-diagnostics"><p>'+error.message+'</p></div>';
      $('#analysis-results').classList.remove('is-hidden');
    }
  }
 const button=$('#analyze-assets');button?.addEventListener('click',run);$('#full-analysis')?.addEventListener('click',()=>openModal({focusAdvanced:false,result:state.result,metric,statBlock,pct,fmt,date}));
 const onResize=()=>{if(state.timelineSlots?.length){renderChart();renderTimelinePanel()}};window.addEventListener('resize',onResize);return{run,prepare,destroy(){window.removeEventListener('resize',onResize)}};
}