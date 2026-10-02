import { createDataClient } from './data/client.js';
import { normalizeCandles } from './data/normalize.js';
import { createViewport } from './chart/viewport.js';
import { createChart } from './chart/render.js';
import { attachChartInteraction } from './chart/interaction.js';
import { attachChartControls } from './chart/controls.js';

const API_BASE='https://oraculum-data-api.4avalonuse.workers.dev';
const dataClient=createDataClient(API_BASE);
const intervals={ '1h':'1h','1d':'1d','1w':'1w','1M':'1M' };
let active=null;
let timelineEvents=[];

async function loadEvents(){
  try{
    const response=await fetch(API_BASE+'/api/events');
    if(!response.ok)throw new Error('Eventos: HTTP '+response.status);
    const payload=await response.json();
    timelineEvents=Array.isArray(payload.data)?payload.data:[];
  }catch(error){
    console.error('[ORACULUM TIMELINE]',error);
    timelineEvents=[];
  }
}

function renderTimeline(candles){
  const host=$('#timeline');
  if(!host||!candles.length)return;
  const min=candles[0].timestamp,max=candles.at(-1).timestamp,span=max-min||1;
  const events=timelineEvents.filter(e=>e.timestamp>=min&&e.timestamp<=max);
  host.innerHTML='<div class="timeline-axis"></div>';
  if(!events.length){
    host.insertAdjacentHTML('beforeend','<div class="timeline-empty">Nenhum evento no período visível.</div>');
    return;
  }
  events.forEach(event=>{
    const pct=((event.timestamp-min)/span)*100;
    const el=document.createElement('div');
    el.className='timeline-event';
    el.style.left=pct+'%';
    el.title=event.description||event.title;
    el.innerHTML='<div class="timeline-event-label">'+
      '<span>'+String(event.title||'Evento').replaceAll('<','&lt;')+'</span>'+
      '<span class="timeline-event-date">'+new Date(event.timestamp).toLocaleDateString('pt-BR')+'</span>'+
      '</div>';
    host.appendChild(el);
  });
}

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
      provider:'yahoo',symbol:'BTC-USD',kind:'ohlcv',interval:intervals[interval]||interval,currency:'USD'
    });
    const candles=normalizeCandles(loaded.candles);
    active?.destroy();

    const viewport=createViewport();
    viewport.setDataBounds(boundsFor(candles));
    const visible=visibleBoundsFor(candles);
    viewport.fitX(visible.x);
    viewport.fitY(visible.y);

    const chart=createChart(host,candles,viewport);
    const detachInteraction=attachChartInteraction({canvas:chart.canvas,viewport,draw:chart.draw});
    const detachControls=attachChartControls({
      fitButton:$('#fit-toggle'),typeButton:$('#chart-type-toggle'),scaleButton:$('#scale-toggle'),
      viewport,candles,draw:chart.draw,onTypeChange:chart.setChartType
    });

    active={destroy(){
      detachControls?.();detachInteraction?.();chart.destroy();
    }};

    $('#source').textContent=(loaded.meta?.provider||'yahoo')+' · '+(intervals[interval]||interval);
    $('#count').textContent=candles.length+' candles';
    $('#status').textContent='OK';
    host.classList.remove('is-loading');
    renderTimeline(candles);
  }catch(error){
    console.error('[ORACULUM]',error);
    $('#status').textContent='ERRO';
    $('#source').textContent=error?.message||'Falha ao carregar dados';
    host.classList.remove('is-loading');
    host.classList.add('is-error');
  }
}

document.querySelectorAll('[data-interval]').forEach(button=>{
  button.addEventListener('click',()=>{
    document.querySelectorAll('[data-interval]').forEach(x=>x.classList.toggle('active',x===button));
    load(button.dataset.interval);
  });
});

loadEvents();
load('1d');