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
let activeEventCategory='ALL';

const EVENT_COLORS={
  Crypto:'#d7d7d7',
  Macro:'#d5a84b',
  Regulation:'#6ea8dc',
  Liquidity:'#9b7bd8',
  Market:'#7fbf8f'
};

function eventCategory(event){
  return String(event?.category||'Other').trim()||'Other';
}
function eventColor(category){
  if(EVENT_COLORS[category])return EVENT_COLORS[category];
  const palette=['#d7d7d7','#d5a84b','#6ea8dc','#9b7bd8','#7fbf8f','#d27c9c'];
  let hash=0; for(const char of category)hash=(hash*31+char.charCodeAt(0))>>>0;
  return palette[hash%palette.length];
}

async function loadEvents(){
  try{
    const response=await fetch(API_BASE+'/api/events');
    if(!response.ok)throw new Error('Eventos: HTTP '+response.status);
    const payload=await response.json();
    timelineEvents=(Array.isArray(payload.data)?payload.data:[])
      .sort((a,b)=>a.timestamp-b.timestamp)
      .slice(-2);
    renderEventMenu();
  }catch(error){
    console.error('[ORACULUM TIMELINE]',error);
    timelineEvents=[];
  }
}

function renderEventMenu(){
  const menu=$('#event-menu');
  if(!menu)return;
  const categories=[...new Set(timelineEvents.map(eventCategory))];
  const visibleEvents=activeEventCategory==='ALL'
    ? timelineEvents
    : timelineEvents.filter(event=>eventCategory(event)===activeEventCategory);
  menu.innerHTML='';

  const head=document.createElement('div');
  head.className='event-menu-head';
  head.innerHTML='<span>EVENTOS</span><span class="event-menu-count">'+visibleEvents.length+'</span>';
  menu.appendChild(head);

  const filters=document.createElement('div');
  filters.className='event-menu-filters';
  const allButton=document.createElement('button');
  allButton.className='event-filter'+(activeEventCategory==='ALL'?' active':'');
  allButton.innerHTML='<i></i>TODOS';
  allButton.addEventListener('click',()=>{activeEventCategory='ALL';renderEventMenu();});
  filters.appendChild(allButton);
  categories.forEach(category=>{
    const button=document.createElement('button');
    button.className='event-filter'+(activeEventCategory===category?' active':'');
    button.style.setProperty('--event-color',eventColor(category));
    button.innerHTML='<i></i>'+category.toUpperCase();
    button.addEventListener('click',()=>{activeEventCategory=category;renderEventMenu();});
    filters.appendChild(button);
  });
  menu.appendChild(filters);

  const list=document.createElement('div');
  list.className='event-menu-list';
  visibleEvents.forEach(event=>{
    const category=eventCategory(event);
    const row=document.createElement('button');
    row.className='event-row';
    row.style.setProperty('--event-color',eventColor(category));
    row.innerHTML='<i></i><span class="event-row-date">'+new Date(event.timestamp).toLocaleDateString('pt-BR')+'</span><strong>'+String(event.title||'Evento')+'</strong>';
    row.title=event.description||event.title||'Evento';
    row.addEventListener('click',()=>{
      activeEventCategory=category;
      renderEventMenu();
      document.querySelectorAll('.timeline-event').forEach(marker=>marker.classList.remove('selected'));
    });
    list.appendChild(row);
  });
  menu.appendChild(list);
}

function focusEvent(event,candles,viewport){
  if(!event||!candles.length||!viewport)return;
  const state=viewport.getState(), bounds=viewport.getBounds();
  const step=candles[1]?.timestamp-candles[0]?.timestamp||86400000;
  const targetSpan=Math.max((state.x.max-state.x.min)*0.4,step*30);
  const half=targetSpan/2;
  const xMin=Math.max(bounds.x.min,event.timestamp-half);
  const xMax=Math.min(bounds.x.max,event.timestamp+half);
  const nearby=candles.filter(c=>c.timestamp>=xMin&&c.timestamp<=xMax);
  if(!nearby.length)return;
  const low=Math.min(...nearby.map(c=>c.low)),high=Math.max(...nearby.map(c=>c.high));
  const pad=(high-low)*0.12||Math.max(Math.abs(high)*0.01,0.000001);
  viewport.setState({
    x:{min:xMin,max:xMax},
    y:{min:Math.max(bounds.y.min,low-pad),max:Math.min(bounds.y.max,high+pad)},
    yScaleType:state.yScaleType
  });
}

function renderTimeline(candles,viewport){
  const host=$('#timeline'),lines=$('#timeline-lines');
  if(!host||!lines||!candles.length)return;
  const state=viewport.getState();
  const min=state.x.min,max=state.x.max,span=max-min||1;
  const events=timelineEvents.filter(e=>e.timestamp>=min&&e.timestamp<=max && (activeEventCategory==='ALL'||eventCategory(e)===activeEventCategory));
  host.innerHTML='';
  lines.innerHTML='';
  if(!events.length)return;
  const plotLeft=10,plotRight=58,plotWidth=Math.max(1,host.clientWidth-plotLeft-plotRight);
  events.forEach(event=>{
    const ratio=Math.max(0,Math.min(1,(event.timestamp-min)/span));
    const x=plotLeft+ratio*plotWidth;
    const line=document.createElement('div');
    line.className='timeline-line';
    line.style.left=x+'px';
    line.title=event.description||event.title||'Evento';
    lines.appendChild(line);
    const marker=document.createElement('div');
    marker.className='timeline-event';
    marker.style.left=x+'px';
    marker.title=(event.title||'Evento')+(event.description?' — '+event.description:'');
    marker.innerHTML='<span class="timeline-event-date">'+new Date(event.timestamp).toLocaleDateString('pt-BR')+'</span>';\n    marker.addEventListener('click',()=>focusEvent(event,candles,viewport));
    host.appendChild(marker);
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
    const detachInteraction=attachChartInteraction({canvas:chart.canvas,viewport,draw:chart.draw,onViewportChanged:()=>renderTimeline(candles,viewport)});
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
    renderTimeline(candles,viewport);
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