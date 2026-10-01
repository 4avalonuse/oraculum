export function attachChartControls({fitButton,typeButton,scaleButton,viewport,candles,draw,onViewportChanged=()=>{},onTypeChange=()=>{}}){
 let timer=null,longPressed=false;
 const fitVisible=()=>{const s=viewport.getState(),shown=candles.filter(c=>c.timestamp>=s.x.min&&c.timestamp<=s.x.max);if(!shown.length)return;viewport.fitY({min:Math.min(...shown.map(c=>c.low)),max:Math.max(...shown.map(c=>c.high))});draw();onViewportChanged()};
 const fitAll=()=>{viewport.fitAll();draw();onViewportChanged()};
 const down=()=>{clearTimeout(timer);longPressed=false;timer=setTimeout(()=>{longPressed=true;fitAll()},550)};
 const up=()=>{clearTimeout(timer);timer=null;if(!longPressed)fitVisible();longPressed=false};
 fitButton?.addEventListener("pointerdown",down);fitButton?.addEventListener("pointerup",up);fitButton?.addEventListener("pointercancel",up);
 typeButton?.addEventListener("click",()=>{const next=typeButton.textContent==="CANDLE"?"line":"candle";typeButton.textContent=next==="line"?"LINE":"CANDLE";onTypeChange(next);draw()});
 const onType=()=>{const next=typeButton.textContent==="CANDLE"?"line":"candle";typeButton.textContent=next==="line"?"LINE":"CANDLE";onTypeChange(next);draw()};
 const onScale=()=>{const next=viewport.getYScaleType()==="logarithmic"?"linear":"logarithmic";if(!viewport.setYScaleType(next))return;scaleButton.textContent=next==="linear"?"NORMAL":"LOG";draw()};
 typeButton?.addEventListener("click",onType);scaleButton?.addEventListener("click",onScale);
 return()=>{fitButton?.removeEventListener("pointerdown",down);fitButton?.removeEventListener("pointerup",up);fitButton?.removeEventListener("pointercancel",up);typeButton?.removeEventListener("click",onType);scaleButton?.removeEventListener("click",onScale)};
}