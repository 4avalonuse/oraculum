import { createDataClient } from './data/client.js';
import { normalizeCandles } from './data/normalize.js';
import { createViewport } from './chart/viewport.js';
import { createChart } from './chart/render.js';
import { attachChartInteraction } from './chart/interaction.js';
import { attachChartControls } from './chart/controls.js';
import { attachComparisonAnalysis } from './analysis/comparison.js';
import { attachTimeline } from './events/timeline.js';
import { getAsset,DEFAULT_ASSET,ASSETS } from './data/assets.js';

const API_BASE='https://oraculum-data-api.4avalonuse.workers.dev';
const dataClient=createDataClient(API_BASE);
const intervals={ '1h':'1h','1d':'1d','1w':'1w','1M':'1M' };
let active=null;
let activeSymbol=DEFAULT_ASSET;
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

async function load(interval='1d'){
  const host=$('#chart');
  $('#status').textContent='CARREGANDO';
  host.classList.add('is-loading');
  host.classList.remove('is-error');
  try{
    const loaded=await dataClient.loadOrPopulate({
      provider:getAsset(activeSymbol).provider,symbol:getAsset(activeSymbol).providerSymbol||activeSymbol,kind:'ohlcv',interval:intervals[interval]||interval,currency:'USD'
    });
    const candles=normalizeCandles(loaded.candles);
    active?.destroy();

    const viewport=createViewport();
    viewport.setDataBounds(boundsFor(candles));
    const visible=visibleBoundsFor(candles);
    viewport.fitX(visible.x);
    viewport.fitY(visible.y);

    const chart=createChart(host,candles,viewport);
    const detachInteraction=attachChartInteraction({canvas:chart.canvas,viewport,draw:chart.draw,setCrosshair:chart.setCrosshair,onViewportChanged:()=>timeline.renderTimeline(candles,viewport)});
    const detachControls=attachChartControls({
      fitButton:$('#fit-toggle'),typeButton:$('#chart-type-toggle'),scaleButton:$('#scale-toggle'),
      viewport,candles,draw:chart.draw,onTypeChange:chart.setChartType
    });

    active={candles,viewport,destroy(){
      detachControls?.();detachInteraction?.();chart.destroy();
    }};

    $('#asset-title').textContent=getAsset(activeSymbol).symbol+' / USD';
    timeline.refreshMenu?.();
    $('#source').textContent=(loaded.meta?.provider||getAsset(activeSymbol).provider)+' · '+(intervals[interval]||interval);
    $('#count').textContent=candles.length+' candles';
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

const assetSelect=$('#asset-select');
assetSelect?.addEventListener('change',()=>{
  activeSymbol=assetSelect.value;
  $('#asset-title').textContent=getAsset(activeSymbol).symbol+' / USD';
  load(activeInterval);
});

let activeInterval='1d';
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
      provider:getAsset(activeSymbol).provider,symbol:getAsset(activeSymbol).providerSymbol||activeSymbol,kind:'ohlcv',interval:intervals[activeInterval],currency:'USD'
    });
    if(loaded?.candles?.length){
      await load(activeInterval);
    }
  }finally{
    button.classList.remove('is-loading');
  }
});

const timeline=attachTimeline({dataClient,getActive:()=>active,getActiveSymbol:()=>activeSymbol});
load('1d');

attachComparisonAnalysis({
  dataClient,
  normalizeCandles,
  getCandles:()=>active?.candles||[],
  getInterval:()=>activeInterval,
  getActiveSymbol:()=>activeSymbol,
  assets:ASSETS
});
