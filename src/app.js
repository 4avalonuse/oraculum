import { createDataClient } from './data/client.js';
import { normalizeCandles } from './data/normalize.js';
import { createViewport } from './chart/viewport.js';
import { createChart } from './chart/render.js';
import { attachChartInteraction } from './chart/interaction.js';
import { attachChartControls } from './chart/controls.js';
import { attachComparisonAnalysis } from './analysis/comparison.js';
import { attachTimeline } from './events/timeline.js';
import { getAsset,DEFAULT_ASSET,ASSETS } from './data/assets.js';
import { attachAssetPicker } from './ui/asset-picker.js';
import { attachDiagnosticCopy } from './ui/diagnostic-copy.js';
import { attachBtcEventStudy } from './analysis/btc-event-study-view.js';

const API_BASE='https://oraculum-data-api.4avalonuse.workers.dev';
const dataClient=createDataClient(API_BASE);
const intervals={ '1h':'1h','1d':'1d','1w':'1w','1M':'1M' };
let active=null;
let activeSymbol=DEFAULT_ASSET;
let activeInterval='1d';
const $=s=>document.querySelector(s);

function boundsFor(c){
  return {x:{min:c[0].timestamp,max:c.at(-1).timestamp},
          y:{min:Math.min(...c.map(x=>x.low)),max:Math.max(...c.map(x=>x.high))}};
}
function visibleBoundsFor(c){
  const v=c.slice(-Math.min(120,c.length));
  return {x:{min:v[0].timestamp,max:v.at(-1).timestamp},
          y:{min:Math.min(...v.map(x=>x.low)),max:Math.max(...v.map(x=>x.high))}};
}

function syncAnalysisTarget(symbol){
  const asset=ASSETS[symbol]||getAsset(DEFAULT_ASSET);
  const select=$('#analysis-reference');
  const label=$('#analysis-target-label');
  const previous=select?.value;
  if(select){
    if(![...select.options].some(option=>option.value===symbol)){
      const option=document.createElement('option');
      option.value=symbol;
      option.textContent=asset.symbol+' · '+asset.name;
      select.appendChild(option);
    }
    select.value=symbol;
  }
  if(label)label.textContent=asset.symbol+' · '+asset.name;
  document.querySelectorAll('.analysis-asset').forEach(input=>{
    const isTarget=input.value===symbol;
    if(isTarget)input.checked=false;
    input.disabled=isTarget;
    input.closest('.asset-pick')?.classList.toggle('is-investigated-asset',isTarget);
  });
  if(previous&&previous!==symbol){
    $('#analysis-results')?.classList.add('is-hidden');
    $('#full-analysis')?.classList.add('is-hidden');
    $('#comparison-panel')?.classList.add('is-hidden');
    $('#analysis-context')?.classList.add('is-hidden');
    const status=$('#analysis-status');
    if(status)status.textContent='REANALISAR';
  }
}

async function load(interval='1d'){
  const asset=getAsset(activeSymbol);
  if(asset.supportedIntervals&&!asset.supportedIntervals.includes(interval)){
    interval=asset.supportedIntervals[0];
    activeInterval=interval;
    const intervalToggle=$('#interval-toggle');
    if(intervalToggle) intervalToggle.textContent=interval.toUpperCase();
    document.querySelectorAll('[data-interval]').forEach(button=>button.classList.toggle('active',button.dataset.interval===interval));
  }
  const host=$('#chart');
  $('#status').textContent='CARREGANDO';
  host.classList.add('is-loading');
  host.classList.remove('is-error');
  try{
    const requestOptions={
      provider:asset.provider,
      symbol:asset.providerSymbol||activeSymbol,
      kind:asset.kind||'ohlcv',
      interval:intervals[interval]||interval,
      currency:'USD'
    };
    let loaded=await dataClient.loadOrPopulate(requestOptions);

    // Spot datasets are read-only on normal page loads to protect D1 quotas.
    // When the user explicitly selects a spot series that has never been
    // populated, perform one initial ingestion so the chart can actually load.
    if(asset.kind==='series'&&(!Array.isArray(loaded.candles)||loaded.candles.length===0)){
      $('#status').textContent='CARREGANDO SÉRIE SPOT';
      loaded=await dataClient.refreshCandles(requestOptions);
    }
    if(!Array.isArray(loaded.candles)||loaded.candles.length===0){
      throw new Error('A série spot ainda não possui observações. Use Atualizar novamente em instantes.');
    }
    const candles=normalizeCandles(loaded.candles);
    active?.destroy();

    const viewport=createViewport();
    viewport.setDataBounds(boundsFor(candles));
    const visible=visibleBoundsFor(candles);
    viewport.fitX(visible.x);
    viewport.fitY(visible.y);

    const chart=createChart(host,candles,viewport);
    if(asset.kind==='series') chart.setChartType('line');
    const typeButton=$('#chart-type-toggle');
    if(typeButton){typeButton.disabled=asset.kind==='series';typeButton.textContent=asset.kind==='series'?'LINE':'CANDLE';}
    const detachInteraction=attachChartInteraction({canvas:chart.canvas,viewport,draw:chart.draw,setCrosshair:chart.setCrosshair,onViewportChanged:()=>timeline.renderTimeline(candles,viewport)});
    const detachControls=attachChartControls({
      fitButton:$('#fit-toggle'),typeButton:asset.kind==='series'?null:$('#chart-type-toggle'),scaleButton:$('#scale-toggle'),
      viewport,candles,draw:chart.draw,onTypeChange:chart.setChartType
    });

    active={candles,viewport,destroy(){
      detachControls?.();detachInteraction?.();chart.destroy();
    }};

    $('#asset-title').textContent=getAsset(activeSymbol).symbol+' / USD';
    timeline.refreshMenu?.();
    const lastObservation=candles.at(-1)?.timestamp;
    const asOf=asset.kind==='series'&&Number.isFinite(lastObservation)?' · até '+new Date(lastObservation).toLocaleDateString('pt-BR'):'';
    $('#source').textContent=(loaded.meta?.sourceName||loaded.meta?.provider||asset.provider)+' · '+(asset.kind==='series'?'SPOT · diário':(intervals[interval]||interval))+asOf;
    $('#count').textContent=candles.length+(asset.kind==='series'?' observações spot':' candles');
    $('#status').textContent='OK';
    host.classList.remove('is-loading');
    timeline.renderTimeline(candles,viewport);
  }catch(error){
    console.error('[ORACULUM]',error);
    $('#status').textContent='ERRO';
    $('#source').textContent=error?.message||'Falha ao carregar dados';
    host.classList.remove('is-loading');
    host.classList.add('is-error');
  }
}

attachAssetPicker({
  load,
  getActiveSymbol:()=>activeSymbol,
  setActiveSymbol:value=>{
    activeSymbol=value;
    syncAnalysisTarget(value);
    activeInterval='1d';
    const intervalToggle=$('#interval-toggle');
    if(intervalToggle) intervalToggle.textContent='1D';
    document.querySelectorAll('[data-interval]').forEach(button=>button.classList.toggle('active',button.dataset.interval==='1d'));
  },
  getActiveInterval:()=>activeInterval
});

const intervalToggle=$('#interval-toggle');
const intervalMenu=$('#interval-menu');
intervalToggle?.addEventListener('click',()=>intervalMenu?.classList.toggle('open'));
document.addEventListener('click',event=>{
  if(!event.target.closest('.interval-control'))intervalMenu?.classList.remove('open');
});
document.querySelectorAll('[data-interval]').forEach(button=>{
  button.addEventListener('click',()=>{
    activeInterval=button.dataset.interval;
    intervalToggle.textContent=button.textContent;
    document.querySelectorAll('[data-interval]').forEach(x=>x.classList.toggle('active',x===button));
    intervalMenu?.classList.remove('open');
    load(activeInterval);
  });
});
$('#refresh-toggle')?.addEventListener('click',async()=>{
  const button=$('#refresh-toggle');
  button.classList.add('is-loading');
  try{
    const loaded=await dataClient.refreshCandles({
      provider:getAsset(activeSymbol).provider,symbol:getAsset(activeSymbol).providerSymbol||activeSymbol,kind:getAsset(activeSymbol).kind||'ohlcv',interval:intervals[getAsset(activeSymbol).supportedIntervals?.includes(activeInterval)?activeInterval:'1d'],currency:'USD'
    });
    if(loaded?.candles?.length){
      await load(getAsset(activeSymbol).supportedIntervals?.includes(activeInterval)?activeInterval:'1d');
    }
  }catch(error){
    console.error('[ORACULUM refresh]',error);
    $('#status').textContent='ERRO';
    $('#source').textContent=error?.message||'Falha ao atualizar dados';
    $('#chart').classList.remove('is-loading');
    $('#chart').classList.add('is-error');
  }finally{
    button.classList.remove('is-loading');
  }
});

const timeline=attachTimeline({dataClient,getActive:()=>active,getActiveSymbol:()=>activeSymbol});
syncAnalysisTarget(activeSymbol);
load('1d');

attachDiagnosticCopy({
  getState:()=>({
    active,
    activeSymbol,
    activeInterval,
    asset:getAsset(activeSymbol)
  })
});

attachComparisonAnalysis({
  dataClient,
  normalizeCandles,
  getCandles:()=>active?.candles||[],
  getInterval:()=>activeInterval,
  getActiveSymbol:()=>activeSymbol,
  assets:ASSETS
});

attachBtcEventStudy({dataClient,normalizeCandles});
