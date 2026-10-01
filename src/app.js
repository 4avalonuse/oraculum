import { loadOrPopulate } from "./data/client.js";
import { normalizeCandles } from "./data/normalize.js";

const DATASET={provider:"yahoo",symbol:"BTC-USD",kind:"ohlcv",interval:"1d",currency:"USD"};
const EVENTS=[
 {date:"2012-11-28",title:"Halving #1",type:"protocol",why:"Primeiro halving do Bitcoin.",read:"Redução programada da emissão; observar a mudança estrutural da oferta ao longo do ciclo."},
 {date:"2016-07-09",title:"Halving #2",type:"protocol",why:"Segundo halving do Bitcoin.",read:"Novo corte na emissão; comparar comportamento do preço antes e depois do evento."},
 {date:"2020-05-11",title:"Halving #3",type:"protocol",why:"Terceiro halving do Bitcoin.",read:"Redução da recompensa por bloco; útil para estudar ciclos de oferta e defasagens temporais."},
 {date:"2024-04-20",title:"Halving #4",type:"protocol",why:"Quarto halving do Bitcoin.",read:"Novo choque programado na emissão; ponto de referência para analisar o ciclo atual."}
];
const EVENT_TYPES={all:"Todos",protocol:"Protocolo",macro:"Macro",market:"Mercado",company:"Empresas"};
const state={candles:[],viewStart:0,viewEnd:0,yMin:null,yMax:null,drag:null,pointers:new Map(),pinch:null,chartType:"candle",scaleType:"linear"};
const $=s=>document.querySelector(s),canvas=$("#chart"),ctx=canvas.getContext("2d"),fitButton=$("#fit"),typeButton=$("#chart-type"),scaleButton=$("#scale-type");
state.eventType="all";state.selectedEvent=null;

async function loadData(){
  try{
    $("#status").textContent="CARREGANDO";
    const loaded=await loadOrPopulate(DATASET);
    state.candles=normalizeCandles(loaded.candles);
    if(!state.candles.length) throw Error("dataset vazio");
    fit();
    $("#status").textContent="OK";
    $("#source-label").textContent=(loaded.meta?.provider||"Binance.US")+" · diário";
    $("#data-label").textContent=state.candles.length+" candles";
  }catch(e){
    $("#status").textContent="ERRO";
    $("#source-label").textContent=e.message;
  }
}
function visibleData(){return state.candles.slice(state.viewStart,state.viewEnd+1)}
function fit(){
  const n=state.candles.length, count=Math.min(120,n);
  state.viewStart=Math.max(0,n-count); state.viewEnd=Math.max(0,n-1);
  fitY(); draw();
}
function fitY(){
  const data=visibleData(); if(!data.length)return;
  const min=Math.min(...data.map(x=>x.low)),max=Math.max(...data.map(x=>x.high)),pad=(max-min||1)*0.04;
  state.yMin=Math.max(0,min-pad); state.yMax=max+pad;
}
fitButton.addEventListener("click",fit);

function visibleCount(){return Math.max(1,state.viewEnd-state.viewStart+1)}
function clampView(){
  const n=state.candles.length;
  state.viewStart=Math.max(0,Math.min(state.viewStart,n-1));
  state.viewEnd=Math.max(state.viewStart,Math.min(state.viewEnd,n-1));
}
function zoomAt(factor,clientX){
  const rect=canvas.getBoundingClientRect(),ratio=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
  const count=visibleCount(),next=Math.max(12,Math.min(state.candles.length,Math.round(count*factor)));
  if(next===count)return;
  const anchor=state.viewStart+ratio*(count-1);
  state.viewStart=Math.round(anchor-ratio*(next-1));
  state.viewEnd=state.viewStart+next-1; clampView(); fitY(); draw();
}
function panPixels(dx,dy=0){
  const width=canvas.clientWidth||1,height=canvas.clientHeight||1;
  const shiftX=Math.round(dx/width*visibleCount());
  if(shiftX){state.viewStart-=shiftX;state.viewEnd-=shiftX;clampView();}
  if(Number.isFinite(state.yMin)&&Number.isFinite(state.yMax)){
    const span=state.yMax-state.yMin||1;
    const shiftY=dy/height*span;
    state.yMin+=shiftY; state.yMax+=shiftY;
  }
  draw();
}
function zoomY(factor,clientY){
  if(!Number.isFinite(state.yMin)||!Number.isFinite(state.yMax))return;
  const rect=canvas.getBoundingClientRect(),ratio=Math.max(0,Math.min(1,(clientY-rect.top)/rect.height));
  const anchor=state.yMax-(state.yMax-state.yMin)*ratio;
  const span=Math.max(0.000001,(state.yMax-state.yMin)*factor);
  state.yMin=anchor-span*(1-ratio);state.yMax=anchor+span*ratio;draw();
}
canvas.addEventListener("wheel",e=>{
  e.preventDefault(); zoomAt(e.deltaY>0?1.12:.89,e.clientX);
},{passive:false});
canvas.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  canvas.setPointerCapture(e.pointerId); state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(state.pointers.size===2){
    const pts=[...state.pointers.values()],dx=pts[0].x-pts[1].x,dy=pts[0].y-pts[1].y;
    state.pinch={distance:Math.hypot(dx,dy),center:(pts[0].x+pts[1].x)/2,centerY:(pts[0].y+pts[1].y)/2}; state.drag=null; return;
  }
  state.drag={x:e.clientX,lastY:e.clientY,start:state.viewStart,end:state.viewEnd}; canvas.style.cursor="grabbing";
});
canvas.addEventListener("pointermove",e=>{
  if(state.pointers.has(e.pointerId))state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(state.pointers.size===2&&state.pinch){
    const pts=[...state.pointers.values()],dx=pts[0].x-pts[1].x,dy=pts[0].y-pts[1].y;
    const distance=Math.hypot(dx,dy),factor=Math.max(0.94,Math.min(1.06,state.pinch.distance/distance));
    if(Math.abs(distance-state.pinch.distance)>3){zoomAt(factor,state.pinch.center);zoomY(factor,state.pinch.centerY??canvas.getBoundingClientRect().height/2);state.pinch.distance=distance;}
    return;
  }
  if(!state.drag)return;
  const dx=e.clientX-state.drag.x,width=canvas.clientWidth||1;
  const shift=Math.round(dx/width*visibleCount());
  state.viewStart=state.drag.start-shift;state.viewEnd=state.drag.end-shift;clampView();panPixels(0,e.clientY-state.drag.lastY);state.drag.lastY=e.clientY;
});
canvas.addEventListener("pointerup",endDrag);
canvas.addEventListener("pointercancel",endDrag);
function endDrag(e){state.pointers.delete(e.pointerId);state.pinch=null;state.drag=null;canvas.style.cursor="grab"}

function resize(){
  const r=canvas.getBoundingClientRect(),d=devicePixelRatio||1;
  canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);draw();
}
addEventListener("resize",resize);

function scaleValue(v){return state.scaleType==="logarithmic"?Math.log(Math.max(v,0.000001)):v}
function fromScaleValue(v){return state.scaleType==="logarithmic"?Math.exp(v):v}
function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  const data=visibleData(); if(!data.length)return;
  if(!Number.isFinite(state.yMin)||!Number.isFinite(state.yMax))fitY();
  const p={l:10,r:58,t:10,b:24},pw=w-p.l-p.r,ph=h-p.t-p.b;
  const syMin=scaleValue(state.yMin),syMax=scaleValue(state.yMax),span=syMax-syMin||1;
  const x=i=>p.l+i/Math.max(data.length-1,1)*pw;
  const y=v=>p.t+(syMax-scaleValue(v))/span*ph;
  ctx.font="10px system-ui";ctx.strokeStyle="#252525";
  for(let i=0;i<5;i++){const yy=p.t+i*ph/4,val=fromScaleValue(syMax-i*span/4);ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(p.l+pw,yy);ctx.stroke();ctx.fillStyle="#666";ctx.fillText(format(val),w-p.r+8,yy+3)}
  if(state.chartType==="line"){
    ctx.strokeStyle="#ddd";ctx.lineWidth=2;ctx.beginPath();
    data.forEach((d,i)=>{const xx=x(i),yy=y(d.close);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.stroke();ctx.lineWidth=1;
  }else{
    const step=pw/Math.max(data.length,1),body=Math.max(2,Math.min(9,step*.62));
    for(let i=0;i<data.length;i++){
      const d=data[i],xx=x(i);ctx.strokeStyle=d.close>=d.open?"#ddd":"#777";ctx.fillStyle=ctx.strokeStyle;
      ctx.beginPath();ctx.moveTo(xx,y(d.high));ctx.lineTo(xx,y(d.low));ctx.stroke();
      const top=Math.min(y(d.open),y(d.close)),height=Math.max(1,Math.abs(y(d.close)-y(d.open)));
      ctx.fillRect(xx-body/2,top,body,height);
    }
  }
  drawEvents(data,x,p,ph);
  $("#range-label").textContent=new Date(data[0].timestamp).toLocaleDateString()+" → "+new Date(data.at(-1).timestamp).toLocaleDateString();
}
function drawEvents(data,x,p,ph){
  const first=data[0].timestamp,last=data.at(-1).timestamp;ctx.font="10px system-ui";
  EVENTS.filter(e=>state.eventType==="all"||e.type===state.eventType).forEach(e=>{
    const t=Date.parse(e.date+"T00:00:00Z");if(t<first||t>last)return;
    const i=data.findIndex(d=>d.timestamp>=t);if(i<0)return;const xx=x(i),selected=state.selectedEvent===e;
    ctx.strokeStyle=selected?"#aaa":"#555";ctx.lineWidth=selected?2:1;ctx.setLineDash(selected?[]:[4,4]);
    ctx.beginPath();ctx.moveTo(xx,p.t);ctx.lineTo(xx,p.t+ph);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=1;
    ctx.fillStyle=selected?"#ddd":"#888";ctx.fillText(e.title,Math.min(xx+5,canvas.clientWidth-p.r-85),p.t+12);
  });
}
function renderEventFilters(){
  const box=$("#event-filters");if(!box)return;
  box.innerHTML=Object.entries(EVENT_TYPES).map(([k,v])=>'<button class="'+(state.eventType===k?"active":"")+'" data-event-type="'+k+'">'+v+'</button>').join("");
  box.querySelectorAll("[data-event-type]").forEach(b=>b.addEventListener("click",()=>{state.eventType=b.dataset.eventType;state.selectedEvent=null;renderEventFilters();renderEventDetail();draw()}));
}
function renderEventDetail(){
  const box=$("#event-detail");if(!box)return;
  if(!state.selectedEvent){box.innerHTML='<span class="muted">Selecione um evento no gráfico ou por categoria.</span>';return}
  const e=state.selectedEvent;
  box.innerHTML='<div class="event-title">'+e.title+'</div><div class="event-meta">'+new Date(e.date+"T00:00:00Z").toLocaleDateString("pt-BR")+' · '+EVENT_TYPES[e.type]+'</div><div><b>Contexto</b><br>'+e.why+'</div><div><b>Leitura estratégica</b><br>'+e.read+'</div>';
}
canvas.addEventListener("click",e=>{
  const data=state.candles.slice(state.viewStart,state.viewEnd+1);if(!data.length)return;
  const rect=canvas.getBoundingClientRect(),p={l:10,r:58},pw=rect.width-p.l-p.r;
  const ratio=Math.max(0,Math.min(1,(e.clientX-rect.left-p.l)/pw)),idx=Math.round(ratio*Math.max(data.length-1,1)),t=data[idx]?.timestamp;
  const candidates=EVENTS.filter(ev=>state.eventType==="all"||ev.type===state.eventType).filter(ev=>{const et=Date.parse(ev.date+"T00:00:00Z");return Math.abs(et-t)<14*86400000});
  if(candidates.length){state.selectedEvent=candidates[0];renderEventDetail();draw();}
});
function format(v){return v>=1000?v.toLocaleString("en-US",{maximumFractionDigits:0}):v.toFixed(2)}
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>$("#status").textContent=b.textContent.toUpperCase()));
typeButton.addEventListener("click",()=>{state.chartType=state.chartType==="candle"?"line":"candle";typeButton.textContent=state.chartType==="candle"?"CANDLE":"LINE";draw()});
scaleButton.addEventListener("click",()=>{
  const next=state.scaleType==="linear"?"logarithmic":"linear";
  if(next==="logarithmic"&&state.yMin<=0)return;
  state.scaleType=next;scaleButton.textContent=next==="linear"?"NORMAL":"LOG";draw()
});
canvas.style.cursor="grab";canvas.style.touchAction="none";renderEventFilters();renderEventDetail();loadData().finally(resize);