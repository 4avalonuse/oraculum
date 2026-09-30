const API_BASE="https://oraculum-data-api.4avalonuse.workers.dev";
const DATASET={provider:"binance-us",symbol:"BTCUSD",kind:"ohlcv",interval:"1d",currency:"USD"};
const EVENTS=[
 {date:"2012-11-28",title:"Halving #1",type:"protocol",why:"Primeiro halving do Bitcoin.",read:"Redução programada da emissão; observar a mudança estrutural da oferta ao longo do ciclo."},
 {date:"2016-07-09",title:"Halving #2",type:"protocol",why:"Segundo halving do Bitcoin.",read:"Novo corte na emissão; comparar comportamento do preço antes e depois do evento."},
 {date:"2020-05-11",title:"Halving #3",type:"protocol",why:"Terceiro halving do Bitcoin.",read:"Redução da recompensa por bloco; útil para estudar ciclos de oferta e defasagens temporais."},
 {date:"2024-04-20",title:"Halving #4",type:"protocol",why:"Quarto halving do Bitcoin.",read:"Novo choque programado na emissão; ponto de referência para analisar o ciclo atual."}
];
const EVENT_TYPES={all:"Todos",protocol:"Protocolo",macro:"Macro",market:"Mercado",company:"Empresas"};
const state={candles:[],viewStart:0,viewEnd:0,drag:null,pointers:new Map(),pinch:null};
const $=s=>document.querySelector(s),canvas=$("#chart"),ctx=canvas.getContext("2d");
state.eventType="all";state.selectedEvent=null;

async function loadData(){
  try{
    $("#status").textContent="CARREGANDO";
    const u=new URL(API_BASE+"/candles");
    Object.entries(DATASET).forEach(([k,v])=>u.searchParams.set(k,v));
    const r=await fetch(u); if(!r.ok) throw Error("HTTP "+r.status);
    const j=await r.json(),rows=Array.isArray(j)?j:(j.candles||j.data||[]);
    state.candles=rows.map(normalize).filter(Boolean);
    if(!state.candles.length) throw Error("dataset vazio");
    fit(); $("#status").textContent="OK";
    $("#source-label").textContent="Binance.US · diário";
    $("#data-label").textContent=state.candles.length+" candles";
  }catch(e){$("#status").textContent="ERRO";$("#source-label").textContent=e.message}
}
function normalize(r){
  const t=Number(r.timestamp??r.time??r.date),o=Number(r.open),h=Number(r.high),l=Number(r.low),c=Number(r.close);
  return[t,o,h,l,c].every(Number.isFinite)?{t,o,h,l,c}:null;
}
function fit(){state.viewStart=0;state.viewEnd=Math.max(0,state.candles.length-1);draw()}
$("#fit").addEventListener("click",fit);

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
  state.viewEnd=state.viewStart+next-1; clampView(); draw();
}
function panPixels(dx){
  const width=canvas.clientWidth||1, shift=Math.round(dx/width*visibleCount());
  if(!shift)return;
  state.viewStart-=shift; state.viewEnd-=shift; clampView(); draw();
}
canvas.addEventListener("wheel",e=>{
  e.preventDefault(); zoomAt(e.deltaY>0?1.12:.89,e.clientX);
},{passive:false});
canvas.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  canvas.setPointerCapture(e.pointerId); state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(state.pointers.size===2){
    const pts=[...state.pointers.values()],dx=pts[0].x-pts[1].x,dy=pts[0].y-pts[1].y;
    state.pinch={distance:Math.hypot(dx,dy),center:(pts[0].x+pts[1].x)/2}; state.drag=null; return;
  }
  state.drag={x:e.clientX,start:state.viewStart,end:state.viewEnd}; canvas.style.cursor="grabbing";
});
canvas.addEventListener("pointermove",e=>{
  if(state.pointers.has(e.pointerId))state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(state.pointers.size===2&&state.pinch){
    const pts=[...state.pointers.values()],dx=pts[0].x-pts[1].x,dy=pts[0].y-pts[1].y;
    const distance=Math.hypot(dx,dy),factor=state.pinch.distance/distance;
    if(Math.abs(distance-state.pinch.distance)>3){zoomAt(factor,state.pinch.center);state.pinch.distance=distance;}
    return;
  }
  if(!state.drag)return;
  const dx=e.clientX-state.drag.x,width=canvas.clientWidth||1;
  const shift=Math.round(dx/width*visibleCount());
  state.viewStart=state.drag.start-shift;state.viewEnd=state.drag.end-shift;clampView();draw();
});
canvas.addEventListener("pointerup",endDrag);
canvas.addEventListener("pointercancel",endDrag);
function endDrag(e){state.pointers.delete(e.pointerId);state.pinch=null;state.drag=null;canvas.style.cursor="grab"}

function resize(){
  const r=canvas.getBoundingClientRect(),d=devicePixelRatio||1;
  canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);draw();
}
addEventListener("resize",resize);

function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  const data=state.candles.slice(state.viewStart,state.viewEnd+1); if(!data.length)return;
  const p={l:10,r:58,t:10,b:24},pw=w-p.l-p.r,ph=h-p.t-p.b;
  const min=Math.min(...data.map(x=>x.l)),max=Math.max(...data.map(x=>x.h)),span=max-min||1;
  const x=i=>p.l+i/Math.max(data.length-1,1)*pw,y=v=>p.t+(max-v)/span*ph;
  ctx.font="10px system-ui";ctx.strokeStyle="#252525";
  for(let i=0;i<5;i++){const yy=p.t+i*ph/4;ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(p.l+pw,yy);ctx.stroke();ctx.fillStyle="#666";ctx.fillText(format(max-i*span/4),w-p.r+8,yy+3)}
  const step=Math.max(1,Math.floor(data.length/100));
  for(let i=0;i<data.length;i+=step){
    const d=data[i],xx=x(i);ctx.strokeStyle="#999";ctx.beginPath();ctx.moveTo(xx,y(d.h));ctx.lineTo(xx,y(d.l));ctx.stroke();
    ctx.beginPath();ctx.moveTo(xx-3,y(d.o));ctx.lineTo(xx,y(d.c));ctx.stroke();
  }
  drawEvents(data,x,p,ph);
  renderEventFilters();
  $("#range-label").textContent=new Date(data[0].t).toLocaleDateString()+" → "+new Date(data.at(-1).t).toLocaleDateString();
}
function drawEvents(data,x,p,ph){
  const first=data[0].t,last=data.at(-1).t;ctx.font="10px system-ui";
  EVENTS.filter(e=>state.eventType==="all"||e.type===state.eventType).forEach(e=>{
    const t=Date.parse(e.date+"T00:00:00Z");if(t<first||t>last)return;
    const i=data.findIndex(d=>d.t>=t);if(i<0)return;const xx=x(i),selected=state.selectedEvent===e;
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
  const ratio=Math.max(0,Math.min(1,(e.clientX-rect.left-p.l)/pw)),idx=Math.round(ratio*Math.max(data.length-1,1)),t=data[idx]?.t;
  const candidates=EVENTS.filter(ev=>state.eventType==="all"||ev.type===state.eventType).filter(ev=>{const et=Date.parse(ev.date+"T00:00:00Z");return Math.abs(et-t)<14*86400000});
  if(candidates.length){state.selectedEvent=candidates[0];renderEventDetail();draw();}
});
function format(v){return v>=1000?v.toLocaleString("en-US",{maximumFractionDigits:0}):v.toFixed(2)}
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>$("#status").textContent=b.textContent.toUpperCase()));
canvas.style.cursor="grab";renderEventFilters();renderEventDetail();loadData().finally(resize);