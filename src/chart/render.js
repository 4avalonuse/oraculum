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
  let crosshair=null;

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
    if(crosshair&&visible.length){
      // Keep the crosshair slightly above/left of the finger so the finger does not cover the candle.
      // The touch position itself is unchanged; only the visual target is offset.
      const crosshairOffsetX=24,crosshairOffsetY=34;
      const cx=Math.max(p.left,Math.min(p.left+pw,crosshair.x-crosshairOffsetX));
      let nearest=visible[0],best=Infinity;
      visible.forEach(c=>{const d=Math.abs(x(c.timestamp)-cx);if(d<best){best=d;nearest=c}});
      const cy=Math.max(p.top,Math.min(p.top+ph,crosshair.y-crosshairOffsetY));
      const priceAt=uv(b-(cy-p.top)/ph*span,s.yScaleType);
      const yAt=y(priceAt);
      ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(180,210,230,.7)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(cx,p.top);ctx.lineTo(cx,p.top+ph);ctx.moveTo(p.left,yAt);ctx.lineTo(p.left+pw,yAt);ctx.stroke();ctx.restore();
      const dateText=new Date(nearest.timestamp).toLocaleDateString('pt-BR');
      const priceText=price(priceAt);
      ctx.save();ctx.font='bold 11px system-ui';
      const priceW=ctx.measureText(priceText).width+14,dateW=ctx.measureText(dateText).width+14;
      ctx.fillStyle='#102538';ctx.strokeStyle='#2b6386';ctx.lineWidth=1;
      const priceY=Math.max(p.top,Math.min(p.top+ph-22,yAt-27));ctx.fillRect(w-p.right+3,priceY,priceW,22);ctx.strokeRect(w-p.right+3,priceY,priceW,22);
      ctx.fillStyle='#e6f5ff';ctx.fillText(priceText,w-p.right+10,priceY+15);
      ctx.fillStyle='#0c2030';const dateX=Math.max(p.left,Math.min(p.left+pw-dateW,cx-dateW/2-14));const dateY=Math.max(p.top+4,h-p.bottom-28);ctx.fillRect(dateX,dateY,dateW,20);ctx.strokeRect(dateX,dateY,dateW,20);
      ctx.fillStyle='#d8efff';ctx.fillText(dateText,dateX+7,dateY+14);
      ctx.restore();
    }
    const first=visible[0],last=visible.at(-1);
    if(first&&last){const el=document.querySelector('#range-label');if(el)el.textContent=new Date(first.timestamp).toLocaleDateString()+' → '+new Date(last.timestamp).toLocaleDateString()}
  }
  function setChartType(next){type=next==='line'?'line':'candle';draw()}
  function setCrosshair(point){crosshair=point?{...point}:null;draw()}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  return{canvas,draw,setChartType,setCrosshair,destroy(){observer.disconnect();canvas.remove()}};
}