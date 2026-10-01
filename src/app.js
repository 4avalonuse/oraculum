import { loadOrPopulate } from "./data/client.js";
import { normalizeCandles } from "./data/normalize.js";
import { createViewport } from "./chart/viewport.js";
import { createChart } from "./chart/render.js";
import { attachChartInteraction } from "./chart/interaction.js";
import { attachChartControls } from "./chart/controls.js";

const DATASET={provider:"yahoo",symbol:"BTC-USD",kind:"ohlcv",interval:"1d",currency:"USD"};
const EVENTS=[
 {date:"2012-11-28",title:"Halving #1",type:"protocol",why:"Primeiro halving do Bitcoin.",read:"Redução programada da emissão; observar a mudança estrutural da oferta ao longo do ciclo."},
 {date:"2016-07-09",title:"Halving #2",type:"protocol",why:"Segundo halving do Bitcoin.",read:"Novo corte na emissão; comparar comportamento do preço antes e depois do evento."},
 {date:"2020-05-11",title:"Halving #3",type:"protocol",why:"Terceiro halving do Bitcoin.",read:"Redução da recompensa por bloco; útil para estudar ciclos de oferta e defasagens temporais."},
 {date:"2024-04-20",title:"Halving #4",type:"protocol",why:"Quarto halving do Bitcoin.",read:"Novo choque programado na emissão; ponto de referência para analisar o ciclo atual."}
];
const EVENT_TYPES={all:"Todos",protocol:"Protocolo",macro:"Macro",market:"Mercado",company:"Empresas"};
const $=s=>document.querySelector(s);
const canvas=$("#chart"),status=$("#status");
const state={candles:[],eventType:"all",selectedEvent:null,viewport:null,chart:null,interactionCleanup:null,controlCleanup:null,interval:"1d"};

function bounds(candles){
 return {
  x:{min:candles[0].timestamp,max:candles.at(-1).timestamp},
  y:{min:Math.min(...candles.map(c=>c.low)),max:Math.max(...candles.map(c=>c.high))}
 };
}
function renderEventFilters(){
 const box=$("#event-filters");if(!box)return;
 box.innerHTML=Object.entries(EVENT_TYPES).map(([k,v])=>'<button class="'+(state.eventType===k?"active":"")+'" data-event-type="'+k+'">'+v+'</button>').join("");
 box.querySelectorAll("[data-event-type]").forEach(b=>b.addEventListener("click",()=>{state.eventType=b.dataset.eventType;state.selectedEvent=null;renderEventFilters();renderEventDetail();state.chart?.draw()}));
}
function renderEventDetail(){
 const box=$("#event-detail");if(!box)return;
 if(!state.selectedEvent){box.innerHTML='<span class="muted">Selecione um evento no gráfico ou por categoria.</span>';return}
 const e=state.selectedEvent;
 box.innerHTML='<div class="event-title">'+e.title+'</div><div class="event-meta">'+new Date(e.date+"T00:00:00Z").toLocaleDateString("pt-BR")+' · '+EVENT_TYPES[e.type]+'</div><div><b>Contexto</b><br>'+e.why+'</div><div><b>Leitura estratégica</b><br>'+e.read+'</div>';
}
function onEventSelect(event){state.selectedEvent=event;renderEventDetail()}
async function loadData(interval=state.interval){
 try{
  status.textContent="CARREGANDO";
  state.interval=interval;
  const loaded=await loadOrPopulate({...DATASET,interval});
  state.candles=normalizeCandles(loaded.candles);
  if(!state.candles.length)throw new Error("dataset vazio");
  state.interactionCleanup?.();
  state.controlCleanup?.();
  state.chart?.destroy?.();
  const viewport=createViewport();
  viewport.setDataBounds(bounds(state.candles));
  const chart=createChart(canvas,{getCandles:()=>state.candles,getEvents:()=>EVENTS,getEventType:()=>state.eventType,getSelectedEvent:()=>state.selectedEvent,onEventSelect},viewport);
  state.viewport=viewport;state.chart=chart;
  const fitCount=Math.min(120,state.candles.length),shown=state.candles.slice(-fitCount);
  viewport.fitX({min:shown[0].timestamp,max:shown.at(-1).timestamp});
  viewport.fitY({min:Math.min(...shown.map(c=>c.low)),max:Math.max(...shown.map(c=>c.high))});
  state.interactionCleanup=attachChartInteraction({canvas,viewport,draw:chart.draw});
  document.querySelectorAll(".interval-btn").forEach(button=>button.classList.toggle("active",button.dataset.interval===state.interval));
  state.controlCleanup=attachChartControls({
   fitButton:$("#fit"),typeButton:$("#chart-type"),scaleButton:$("#scale-type"),
   viewport,candles:state.candles,draw:chart.draw,
   onTypeChange:type=>chart.setType(type)
  });
  chart.draw();
  status.textContent="OK";
  $("#source-label").textContent=(loaded.meta?.provider||"Yahoo")+" · "+({1h:"horário",1d:"diário",1w:"semanal",1M:"mensal"}[state.interval]||state.interval);
  $("#data-label").textContent=state.candles.length+" candles";
 }catch(e){
  status.textContent="ERRO";
  $("#source-label").textContent=e.message;
  console.error("[ORACULUM]",e);
 }
}
document.querySelectorAll(".interval-btn").forEach(button=>button.addEventListener("click",()=>loadData(button.dataset.interval)));
renderEventFilters();
renderEventDetail();
loadData();