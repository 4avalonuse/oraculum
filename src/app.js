const API_BASE="https://oraculum-data-api.4avalonuse.workers.dev";
const DATASET={provider:"binance-us",symbol:"BTCUSD",kind:"ohlcv",interval:"1d",currency:"USD"};
const state={candles:[],viewStart:0,viewEnd:0};

const $=s=>document.querySelector(s);
const canvas=$("#chart"),ctx=canvas.getContext("2d");

async function loadData(){
  $("#status").textContent="CARREGANDO";
  try{
    const url=new URL(API_BASE+"/candles");
    Object.entries(DATASET).forEach(([k,v])=>url.searchParams.set(k,v));
    const response=await fetch(url);
    if(!response.ok) throw new Error("HTTP "+response.status);
    const json=await response.json();
    const rows=Array.isArray(json)?json:(json.candles||json.data||[]);
    state.candles=rows.map(normalize).filter(Boolean);
    if(!state.candles.length) throw new Error("dataset vazio");
    fit();
    $("#status").textContent="OK";
    $("#source-label").textContent="Binance.US · diário";
    $("#data-label").textContent=state.candles.length+" candles";
  }catch(error){
    $("#status").textContent="ERRO";
    $("#source-label").textContent=error.message;
  }
}

function normalize(row){
  const t=Number(row.timestamp??row.time??row.date);
  const o=Number(row.open),h=Number(row.high),l=Number(row.low),c=Number(row.close);
  return [t,o,h,l,c].every(Number.isFinite)?{t,o,h,l,c}:null;
}

function fit(){state.viewStart=0;state.viewEnd=state.candles.length-1;draw()}
$("#fit").addEventListener("click",fit);

function resize(){const r=canvas.getBoundingClientRect();const d=devicePixelRatio||1;canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);draw()}
window.addEventListener("resize",resize);

function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);
  const data=state.candles.slice(state.viewStart,state.viewEnd+1);if(!data.length)return;
  const pad={l:12,r:52,t:12,b:24};const pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
  const min=Math.min(...data.map(x=>x.l)),max=Math.max(...data.map(x=>x.h));const span=max-min||1;
  const x=i=>pad.l+i/(Math.max(data.length-1,1))*pw;const y=v=>pad.t+(max-v)/span*ph;
  ctx.strokeStyle="#252525";ctx.lineWidth=1;
  for(let i=0;i<5;i++){const yy=pad.t+i*ph/4;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(pad.l+pw,yy);ctx.stroke();ctx.fillStyle="#666";ctx.fillText(format(max-i*span/4),w-pad.r+8,yy+3)}
  const step=Math.max(1,Math.floor(data.length/90));
  for(let i=0;i<data.length;i+=step){const d=data[i],xx=x(i),yo=y(d.o),yh=y(d.h),yl=y(d.l),yc=y(d.c);ctx.strokeStyle="#aaa";ctx.beginPath();ctx.moveTo(xx,yh);ctx.lineTo(xx,yl);ctx.stroke();ctx.beginPath();ctx.moveTo(xx-3,yo);ctx.lineTo(xx,yc);ctx.stroke()}
  drawEvents(data,x,y,pad,ph);
  $("#range-label").textContent=new Date(data[0].t).toLocaleDateString()+" → "+new Date(data.at(-1).t).toLocaleDateString();
}

function drawEvents(data,x,y,pad,ph){
  const events=[{date:"2020-05-11",label:"HALVING #3"},{date:"2024-04-20",label:"HALVING #4"}];
  const first=data[0].t,last=data.at(-1).t;
  ctx.font="10px system-ui";
  for(const e of events){const t=new Date(e.date+"T00:00:00").getTime();if(t<first||t>last)continue;const i=data.findIndex(d=>d.t>=t);if(i<0)continue;const xx=x(i);ctx.strokeStyle="#555";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,pad.t);ctx.lineTo(xx,pad.t+ph);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#999";ctx.fillText(e.label,Math.min(xx+5,pad.l+canvas.clientWidth-pad.r-90),pad.t+12)}
}

function format(v){return v>=1000?v.toLocaleString("en-US",{maximumFractionDigits:0}):v.toFixed(2)}

document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>$("#status").textContent=b.textContent.toUpperCase()));
loadData().finally(resize);
