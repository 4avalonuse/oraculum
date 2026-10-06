function sv(v,t){return t==='logarithmic'?Math.log(Math.max(v,0.000001)):v}
function uv(v,t){return t==='logarithmic'?Math.exp(v):v}
function price(v){return v>=1000?v.toLocaleString('en-US',{maximumFractionDigits:0}):v.toLocaleString('en-US',{maximumFractionDigits:2})}

export function createChart(host,candles,viewport){
  const canvas=document.createElement('canvas');
  canvas.className='chart-canvas';
  canvas.setAttribute('aria-label','Gráfico principal do ORACULUM');
  host.prepend(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas 2D indisponível');
  let type='candle';

  function resize(){
    const r=host.getBoundingClientRect(),d=window.devicePixelRatio||1;
    canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));
    canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';draw();
  }
  function draw(){
    const w=host.clientWidth,h=host.clientHeight,s=viewport.getState();
    ctx.setTransform(devicePixelRatio||1,0,0,devicePixelRatio||1,0,0);ctx.clearRect(0,0,w,h);
    if(!candles.length||s.y.max<=s.y.min)return;
    if(s.yScaleType==='logarithmic'&&s.y.min<=0)return;
    const p={left:10,right:58,top:10,bottom:24},pw=Math.max(1,w-p.left-p.right),ph=Math.max(1,h-p.top-p.bottom);
    const a=sv(s.y.min,s.yScaleType),b=sv(s.y.max,s.yScaleType),span=b-a||1,xspan=s.x.max-s.x.min||1;
    const x=t=>p.left+((t-s.x.min)/xspan)*pw,y=v=>p.top+(b-sv(v,s.yScaleType))/span*ph;
    ctx.font='10px system-ui';ctx.strokeStyle='#252525';ctx.fillStyle='#666';
    for(let i=0;i<5;i++){const yy=p.top+i*ph/4;ctx.beginPath();ctx.moveTo(p.left,yy);ctx.lineTo(p.left+pw,yy);ctx.stroke();ctx.fillText(price(uv(b-(b-a)*i/4,s.yScaleType)),w-p.right+8,yy+3)}
    const visible=candles.filter(c=>c.timestamp>=s.x.min&&c.timestamp<=s.x.max),step=pw/Math.max(visible.length,1);
    if(type==='line'){
      ctx.strokeStyle='#dbe4ee';ctx.lineWidth=2;ctx.beginPath();
      visible.forEach((c,i)=>i?ctx.lineTo(x(c.timestamp),y(c.close)):ctx.moveTo(x(c.timestamp),y(c.close)));ctx.stroke();ctx.lineWidth=1;
    }else{
      const bw=Math.max(2,Math.min(10,step*.62));
      visible.forEach(c=>{const xx=x(c.timestamp);ctx.strokeStyle=c.close>=c.open?'#4ade80':'#f87171';ctx.fillStyle=ctx.strokeStyle;
        const yo=y(c.open),yc=y(c.close),yh=y(c.high),yl=y(c.low);
        // Keep very small/doji candles visible on dense/mobile charts without changing OHLC data.
        ctx.beginPath();ctx.moveTo(xx,yh);ctx.lineTo(xx,yl);ctx.stroke();
        const bodyTop=Math.min(yo,yc),bodyHeight=Math.max(2,Math.abs(yc-yo));
        ctx.fillRect(xx-bw/2,bodyTop,bw,bodyHeight);
      });
    }
    const first=visible[0],last=visible.at(-1);
    if(first&&last){const el=document.querySelector('#range-label');if(el)el.textContent=new Date(first.timestamp).toLocaleDateString()+' → '+new Date(last.timestamp).toLocaleDateString()}
  }
  function setChartType(next){type=next==='line'?'line':'candle';draw()}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  return{canvas,draw,setChartType,destroy(){observer.disconnect();canvas.remove()}};
}