import {mountComparisonResults} from './comparison-results-controller.js';
import {buildScientificExplanationMarkup} from './scientific-explanation-view.js';
import {buildExplanatoryModelMarkup} from './explanatory-model-view.js';
import {buildNumericalValidationMarkup} from './numerical-validation-view.js';
import {buildComparisonMetricSections} from './comparison-metrics-view.js';
import {comparisonContextMarkup} from './comparison-context-view.js';
import {timelineRowsFor as slotRowsFor,rowsInWindow as windowRows,periodKeyFor as timelinePeriodKey,makeTimelineSlot,startTimelineWindow,sharedTimelineRows} from './timeline-window-data.js';
/* ORACULUM — análise investigativa sob demanda */
import {alignSeries} from './engine.js';
import {analyzeTimelineWindows} from './analysis-runner.js';
import {openModal} from './analysis-modal.js';
import {wireMetricHelp} from './metric-help.js';
import {fmt,pct,date,metric,statBlock} from './view/formatters.js';
import {nearestTimelineIndex,timelineWindow,timelineAssetKeys} from './timeline-state.js';
import {ScientificStatus,inspectWindowSamples} from './validation/sample-quality.js';
import {activeTimelineSlots,toggleTimelineActive} from './timeline-activation.js';
import {renderComparisonPlot} from './timeline-chart-view.js';
import {timelineRowsMarkup} from './timeline-rows-view.js';
import {renderTimelineToolbar} from './timeline-toolbar-view.js';
import {createTimelineViewModes} from './timeline-view-modes.js';
import {timelineLayout} from './timeline-layout.js';
import {createSequentialViewport} from './timeline-viewport.js';
import {moveWindowByFrames} from './timeline-window-movement.js';
import {createTimelinePointerHandlers} from './timeline-pointer-interactions.js';
import {synchronizeWindowFrameCounts} from './timeline-duration-sync.js';

export function attachComparisonAnalysis({dataClient,normalizeCandles,getCandles,getInterval,getActiveSymbol,assets}){
 wireMetricHelp(document);
 const $=s=>document.querySelector(s),state={rows:null,result:null,selected:[],series:[],assetPool:[],assetCatalog:[],timelineRows:{},commonSeries:[],timelineSlots:[],markers:{start:0,base:0,end:0},interval:'1d',independentTimelines:false,timelineMode:'common',addAssetKey:'',prepared:false};
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
 const timelineRowsFor=slotRowsFor;
 const rowsInWindow=windowRows;
 const periodKeyFor=timelinePeriodKey;
 const makeSlot=(asset,index)=>makeTimelineSlot(asset,index,state.interval);
 const startWindow=startTimelineWindow;
 const sharedRows=()=>sharedTimelineRows(state.timelineSlots,state.interval);
 const viewModes=createTimelineViewModes();
 const viewport=createSequentialViewport();
 const alignAllTimelines=()=>{
   viewModes.toggleAlignment();
   viewport.reset();
   renderTimelineControls();renderTimelinePanel();renderChart();markTimelinesChanged();
 };
 const visibleTimelineLayout=()=>timelineLayout(state.timelineSlots,timelineRowsFor,viewModes.alignment,viewport.start(state.timelineSlots,timelineRowsFor));
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
     synchronizeWindowFrameCounts(state.timelineSlots,timelineRowsFor);
     renderTimelineControls();renderTimelinePanel();renderChart();markTimelinesChanged();
   }catch(error){
     console.error('[ORACULUM ADD ASSET]',error);
     if(status)status.textContent='NÃO FOI POSSÍVEL ADICIONAR '+(meta.symbol||assetKey);
   }
 };
 const renderTimelineControls=()=>renderTimelineToolbar({
   host:$('#comparison-timeline-controls'),catalog:state.assetCatalog,
   modes:viewModes,viewport,slots:state.timelineSlots,rowsInWindow,
   onAlign:alignAllTimelines,
   onPrevious:()=>{viewport.previous();renderTimelineControls();renderTimelinePanel();renderChart();},
   onNext:()=>{viewport.next(state.timelineSlots,timelineRowsFor);renderTimelineControls();renderTimelinePanel();renderChart();},
   onChart:()=>{viewModes.toggleChart();renderTimelineControls();renderChart();markTimelinesChanged();},
   onAdd:addCatalogAsset
 });
 const renderTimelinePanel=()=>{
   const host=$('#comparison-timelines');
   if(!host||!state.timelineSlots.length)return;
   host.innerHTML=timelineRowsMarkup({slots:state.timelineSlots,layouts:visibleTimelineLayout(),assetColor,date});
   host.querySelectorAll('[data-duplicate-slot]').forEach(button=>button.addEventListener('click',()=>{
     const original=state.timelineSlots[Number(button.dataset.duplicateSlot)];
     if(!original)return;
     const duplicate=makeSlot(original,Date.now());
     duplicate.slotIndex=state.timelineSlots.length;
     duplicate.window={...original.window};
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
   const slot=state.timelineSlots[index];
   if(slot?.window?.valid)slot.window=moveWindowByFrames(timelineRowsFor(slot),slot.window,steps);
 };
 const updateTimelineSelectionVisuals=()=>{
   const host=$('#comparison-timelines');
   if(!host)return;
   const layouts=visibleTimelineLayout(),capacity=layouts[0]?.capacity||1;
   layouts.forEach((layout,index)=>{
     const row=host.querySelector('[data-timeline-row="'+index+'"]');
     if(!row)return;
     const left=Math.max(0,Math.min(100,layout.position/capacity*100));
     const right=Math.max(0,Math.min(100,(layout.position+layout.visibleCount)/capacity*100));
     const range=row.querySelector('.cmp-timeline-range');
     if(range){range.style.left=left+'%';range.style.width=Math.max(0,right-left)+'%';}
     if(index===0){
       const a=row.querySelector('.handle-start'),b=row.querySelector('.handle-end');
       if(a)a.style.left='clamp(12px,'+left+'%,calc(100% - 12px))';
       if(b)b.style.left='clamp(12px,'+right+'%,calc(100% - 12px))';
     }
   });
 };
 const pointerHandlers=createTimelinePointerHandlers({
   slots:()=>state.timelineSlots,rowsForSlot:timelineRowsFor,
   renderChart:()=>renderChart(),renderPanel:()=>renderTimelinePanel(),
   renderSelection:()=>updateTimelineSelectionVisuals(),
   markChanged:markTimelinesChanged,formatDate:date
 });
 const beginTimelineDrag=(event,index)=>pointerHandlers.drag(event,index);
 const beginTimelineResize=(event,edge)=>pointerHandlers.resize(event,edge);
 const renderChart=()=>renderComparisonPlot({
   host:$('#comparison-chart'),legend:$('#comparison-legend'),
   slots:state.timelineSlots,layouts:visibleTimelineLayout(),
   mode:viewModes.chart,alignment:viewModes.alignment,assetColor,date
 });
 const sameWindowDates=slots=>slots.every(slot=>{
   const rows=rowsInWindow(slot),first=rows[0],last=rows.at(-1),main=rowsInWindow(slots[0]);
   return first&&last&&main[0]&&main.at(-1)&&periodKeyFor(first)===periodKeyFor(main[0])&&periodKeyFor(last)===periodKeyFor(main.at(-1));
 });
 const recomputeTimelineAnalysis=()=>{
   if(!state.timelineSlots.length)return;
   const returnMode=$('#analysis-return')?.value||'log',rollingWindow=Number($('#analysis-window')?.value||30),interval=state.interval||'1d',slots=activeTimelineSlots(state.timelineSlots);
   const layouts=visibleTimelineLayout();
   const timelineRows=Object.fromEntries(slots.map(slot=>[slot.key,rowsInWindow(slot)]));
   const sampleCheck=inspectWindowSamples(slots.map(slot=>timelineRows[slot.key]));
   if(sampleCheck.status===ScientificStatus.BLOCKED){
     const issue=sampleCheck.issues[0];
     const messages={INSUFFICIENT_SAMPLE:'AMOSTRA INSUFICIENTE',FRAME_COUNT_MISMATCH:'FRAMES DESIGUAIS · AJUSTE AS JANELAS',INVALID_TIME_ORDER:'DATAS INVÁLIDAS · REVISE OS DADOS',NO_WINDOWS:'NENHUMA JANELA SELECIONADA'};
     $('#analysis-status').textContent=messages[issue?.code]||'AMOSTRA INVÁLIDA';
     return;
   }
   state.timelineRows=timelineRows;state.series=slots;state.selected=slots.map(slot=>slot.key);
   const output=analyzeTimelineWindows({slots,timelineRows,interval,returnMode,rollingWindow,layouts,alignment:viewModes.alignment,chartMode:viewModes.chart,sameWindowDates});
   state.rows=output.rows;state.commonSeries=output.commonSeries;state.independentTimelines=output.independentTimelines;
   state.result=output.result;state.markers={start:0,base:0,end:Math.max(0,(state.rows?.length||1)-1)};
   render(output.result,slots);
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
   synchronizeWindowFrameCounts(state.timelineSlots,timelineRowsFor);
   if(period!=='full'){
     const common=sharedRows(),end=common.at(-1);
     if(end){
       const startLimit=end.timestamp-Number(period)*86400000;
       const wanted=common.find(row=>row.timestamp>=startLimit)||common[0];
       const main=state.timelineSlots[0],rows=timelineRowsFor(main);
       const a=rows.findIndex(row=>periodKeyFor(row)===wanted.__periodKey),b=rows.findIndex(row=>periodKeyFor(row)===end.__periodKey);
       if(a>=0&&b>=a)main.window=timelineWindow(rows,a,b,10);
       synchronizeWindowFrameCounts(state.timelineSlots,timelineRowsFor);
     }
   }
   renderTimelineControls();renderTimelinePanel();
 };

 const renderContext=(result,series)=>{
   $('#analysis-context').innerHTML=comparisonContextMarkup(result,series);
   $('#analysis-context').classList.remove('is-hidden');
 };


 const render=(result,series)=>{
   state.result=result;state.selected=series.map(x=>x.key);$('#comparison-panel').classList.remove('is-hidden');$('#analysis-status').textContent='CONCLUÍDA';
   $('#comparison-period').textContent=date(result.rowsStart)+' → '+date(result.rowsEnd)+' · '+result.observations+' observações';
   renderContext(result,series);renderChart();renderTimelineControls();renderTimelinePanel();
   const primary=result.series[series[0].key],relations=result.relations;
   let html=buildComparisonMetricSections(result,series,state.independentTimelines);
   html+=buildNumericalValidationMarkup(result);

   html+=buildScientificExplanationMarkup(result,series);
   mountComparisonResults({html,state,assets});
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