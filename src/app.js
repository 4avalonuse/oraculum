const API="https://oraculum-data-api.4avalonuse.workers.dev";
const DATA={provider:"yahoo",symbol:"BTC-USD",kind:"ohlcv",interval:"1d",currency:"USD"};
const state={rows:[],interval:"1d",type:"candle",scale:"linear",start:0,end:0};
const $=s=>document.querySelector(s);
const canvas=$("#chart"),ctx=canvas.getContext("2d");

function num(v,n){const x=Number(v);if(!Number.isFinite(x))throw Error("Candle inválido: "+n);return x}
function normalize(rows){
 if(!Array.isArray(rows)||!rows.length)throw Error("Nenhum candle recebido");
 const out=rows.map((r,i)=>{
   let t=num(r.timestamp??r.t??r.time??r.date,"timestamp");
   if(Math.abs(t)<1e12)t*=1000;
   const c={t,o:num(r.open??r.o,"open"),h:num(r.high??r.h,"high"),l:num(r.low??r.l,"low"),c:num(r.close??r.c,"close")};
   if(c.h<c.l||c.h<c.o||c.h<c.c||c.l>c.o||c.l>c.c)throw Error("OHLC inválido no índice "+i);
   return c;
 });
 out.sort((a,b)=>a.t-b.t);
 for(let i=1;i<out.length;i++)if(out[i].t===out[i-1].t)throw Error("Timestamp duplicado");
 return out;
}

async function getJson(path,options){
 const r=await fetch(API+path,{...options,cache:"no-store",headers:{Accept:"application/json"}});
 const text=await r.text();let j=null;try{j=text?JSON.parse(text):null}catch{throw Error("Data API retornou JSON inválido")}
 if(!r.ok)throw Error(j?.error||j?.message||("HTTP "+r.status));
 return j;
}
async function findDataset(){
 const j=await getJson("/api/datasets");
 const list=Array.isArray(j)?j:j?.data;
 if(!Array.isArray(list))throw Error("Catálogo inválido");
 const d=list.find(x=>x?.provider===DATA.provider&&x?.symbol===DATA.symbol&&x?.interval===state.interval&&x?.kind===DATA.kind&&(x?.currency===DATA.currency));
 if(!d?.id)throw Error("Dataset não encontrado: "+DATA.provider+"/"+DATA.symbol+"/"+state.interval);
 return d;
}
async function load(){
 const id=++state.loadId;$("#status").textContent="CARREGANDO";$("#source").textContent="consultando Data API...";
 try{
   const dataset=await findDataset();
   let j=await getJson("/api/datasets/"+encodeURIComponent(dataset.id));
   if(!j?.ok||!Array.isArray(j.data))throw Error("Contrato do dataset inválido");
   if(!j.data.length){
     j=await getJson("/api/datasets/"+encodeURIComponent(dataset.id)+"/refresh",{method:"POST"});
     if(!j?.ok||!Array.isArray(j.data))throw Error("Refresh retornou contrato inválido");
   }
   const rows=normalize(j.data);
   if(id!==state.loadId)return;
   state.rows=rows;state.start=Math.max(0,rows.length-120);state.end=rows.length-1;
   $("#status").textContent="OK";$("#source").textContent=(j.meta?.provider||dataset.provider)+" · "+state.interval;
   $("#count").textContent=rows.length+" candles";draw();
 }catch(e){if(id!==state.loadId)return;$("#status").textContent="ERRO";$("#source").textContent=e.message;console.error("[ORACULUM]",e)}
}

function fit(){if(!state.rows.length)return;state.start=0;state.end=state.rows.length-1;draw()}
function visible(){return state.rows.slice(state.start,state.end+1)}
function price(v){return v>=1000?v.toLocaleString("en-US",{maximumFractionDigits:0}):v.toLocaleString("en-US",{maximumFractionDigits:2})}
function resize(){const r=canvas.getBoundingClientRect(),d=window.devicePixelRatio||1;canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));draw()}
function draw(){
 const rows=visible(),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const d=window.devicePixelRatio||1;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);if(!rows.length)return;
 const p={l:10,r:58,t:10,b:24},pw=w-p.l-p.r,ph=h-p.t-p.b;
 const lo=Math.min(...rows.map(x=>x.l)),hi=Math.max(...rows.map(x=>x.h));
 const ymin=state.scale==="log"?Math.log(Math.max(lo,.000001)):lo,ymax=state.scale==="log"?Math.log(Math.max(hi,.000001)):hi,span=ymax-ymin||1;
 const yy=v=>{const q=state.scale==="log"?Math.log(Math.max(v,.000001)):v;return p.t+(ymax-q)/span*ph};
 for(let i=0;i<5;i++){const y=p.t+i*ph/4;ctx.strokeStyle="#252525";ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(p.l+pw,y);ctx.stroke();const q=ymax-(ymax-ymin)*i/4;ctx.fillStyle="#666";ctx.font="10px system-ui";ctx.fillText(price(state.scale==="log"?Math.exp(q):q),w-p.r+7,y+3)}
 const step=pw/Math.max(rows.length,1),bw=Math.max(2,Math.min(10,step*.62));
 rows.forEach((c,i)=>{const x=p.l+(i/(Math.max(rows.length-1,1)))*pw;if(state.type==="line"){if(i===0){ctx.beginPath();ctx.strokeStyle="#dbe4ee";ctx.lineWidth=2}ctx.lineTo(x,yy(c.c));if(i===rows.length-1)ctx.stroke()}else{ctx.strokeStyle=c.c>=c.o?"#4ade80":"#f87171";ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(x,yy(c.h));ctx.lineTo(x,yy(c.l));ctx.stroke();ctx.fillRect(x-bw/2,Math.min(yy(c.o),yy(c.c)),bw,Math.max(1,Math.abs(yy(c.c)-yy(c.o))))}});
 const a=rows[0],b=rows[rows.length-1];$("#range").textContent=new Date(a.t).toLocaleDateString()+" → "+new Date(b.t).toLocaleDateString();
}
$("#fit").onclick=fit;
$("#type").onclick=()=>{state.type=state.type==="candle"?"line":"candle";$("#type").textContent=state.type==="candle"?"CANDLE":"LINE";draw()};
$("#scale").onclick=()=>{state.scale=state.scale==="linear"?"log":"linear";$("#scale").textContent=state.scale==="linear"?"NORMAL":"LOG";draw()};
document.querySelectorAll("[data-interval]").forEach(b=>b.onclick=()=>{state.interval=b.dataset.interval;document.querySelectorAll("[data-interval]").forEach(x=>x.classList.toggle("active",x===b));load()});
canvas.addEventListener("wheel",e=>{e.preventDefault();if(!state.rows.length)return;const n=state.end-state.start+1,next=Math.max(20,Math.min(state.rows.length,Math.round(n*(e.deltaY>0?1.12:.89))));const r=canvas.getBoundingClientRect(),q=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),a=state.start+q*(n-1);state.start=Math.round(a-q*(next-1));state.end=state.start+next-1;state.start=Math.max(0,state.start);state.end=Math.min(state.rows.length-1,state.end);draw()},{passive:false});
let drag=null;
canvas.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,start:state.start,end:state.end};canvas.style.cursor="grabbing"});
canvas.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,shift=Math.round(dx/(canvas.clientWidth||1)*(drag.end-drag.start+1));state.start=Math.max(0,Math.min(state.rows.length-1,drag.start-shift));state.end=Math.max(state.start,Math.min(state.rows.length-1,drag.end-shift));draw()});
canvas.addEventListener("pointerup",()=>{drag=null;canvas.style.cursor="grab"});
canvas.addEventListener("pointercancel",()=>{drag=null;canvas.style.cursor="grab"});
new ResizeObserver(resize).observe(canvas);
resize();load();
