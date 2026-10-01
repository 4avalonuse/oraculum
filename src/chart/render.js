function sv(v,t){return t==="logarithmic"?Math.log(Math.max(v,.000001)):v}
function uv(v,t){return t==="logarithmic"?Math.exp(v):v}
function price(v){return v>=1000?v.toLocaleString("en-US",{maximumFractionDigits:0}):v.toLocaleString("en-US",{maximumFractionDigits:2})}
export function createChart(canvas,{getCandles,getEvents,getEventType,getSelectedEvent,onEventSelect},viewport){
  const ctx=canvas.getContext("2d");let type="candle";
  function resize(){const r=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));draw()}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  function draw(){
    const w=canvas.clientWidth,h=canvas.clientHeight,d=getCandles(),s=viewport.getState();ctx.setTransform(devicePixelRatio||1,0,0,devicePixelRatio||1,0,0);ctx.clearRect(0,0,w,h);if(!d.length)return;
    const p={left:10,right:58,top:10,bottom:24},pw=w-p.left-p.right,ph=h-p.top-p.bottom,a=sv(s.y.min,s.yScaleType),b=sv(s.y.max,s.yScaleType),span=b-a||1,xspan=s.x.max-s.x.min||1,x=t=>p.left+((t-s.x.min)/xspan)*pw,y=v=>p.top+(b-sv(v,s.yScaleType))/span*ph;
    ctx.font="10px system-ui";ctx.strokeStyle="#252525";ctx.fillStyle="#666";
    for(let i=0;i<5;i++){const yy=p.top+i*ph/4;ctx.beginPath();ctx.moveTo(p.left,yy);ctx.lineTo(p.left+pw,yy);ctx.stroke();ctx.fillText(price(uv(b-(b-a)*i/4,s.yScaleType)),w-p.right+8,yy+3)}
    const visible=d.filter(c=>c.timestamp>=s.x.min&&c.timestamp<=s.x.max),step=pw/Math.max(visible.length,1);
    if(type==="line"){ctx.strokeStyle="#dbe4ee";ctx.lineWidth=2;ctx.beginPath();visible.forEach((c,i)=>{const xx=x(c.timestamp),yy=y(c.close);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.stroke();ctx.lineWidth=1}
    else{const bw=Math.max(2,Math.min(10,step*.62));visible.forEach(c=>{const xx=x(c.timestamp);ctx.strokeStyle=c.close>=c.open?"#4ade80":"#f87171";ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(xx,y(c.high));ctx.lineTo(xx,y(c.low));ctx.stroke();ctx.fillRect(xx-bw/2,Math.min(y(c.open),y(c.close)),bw,Math.max(1,Math.abs(y(c.close)-y(c.open))))})}
    const events=getEvents().filter(e=>getEventType()==="all"||e.type===getEventType());events.forEach(e=>{const t=Date.parse(e.date+"T00:00:00Z");if(t<s.x.min||t>s.x.max)return;const xx=x(t),sel=getSelectedEvent()===e;ctx.strokeStyle=sel?"#aaa":"#555";ctx.lineWidth=sel?2:1;ctx.setLineDash(sel?[]:[4,4]);ctx.beginPath();ctx.moveTo(xx,p.top);ctx.lineTo(xx,p.top+ph);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=sel?"#ddd":"#888";ctx.fillText(e.title,Math.min(xx+5,w-p.right-85),p.top+12)});
    const r0=visible[0],r1=visible.at(-1);if(r0&&r1)document.querySelector("#range-label").textContent=new Date(r0.timestamp).toLocaleDateString()+" → "+new Date(r1.timestamp).toLocaleDateString();
  }
  function setType(next){type=next==="line"?"line":"candle";draw()}
  const onClick=e=>{const s=viewport.getState(),r=canvas.getBoundingClientRect(),w=Math.max(1,r.width-68),ratio=Math.max(0,Math.min(1,(e.clientX-r.left-10)/w)),t=s.x.min+(s.x.max-s.x.min)*ratio,c=getEvents().filter(ev=>getEventType()==="all"||ev.type===getEventType()).filter(ev=>Math.abs(Date.parse(ev.date+"T00:00:00Z")-t)<14*86400000);if(c.length){onEventSelect?.(c[0]);draw()}};
  canvas.addEventListener("click",onClick);
  resize();return{draw,setType,destroy(){observer.disconnect();canvas.removeEventListener("click",onClick)}};
}