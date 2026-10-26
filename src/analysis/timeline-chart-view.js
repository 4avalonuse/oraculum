/* Rendering only: chart presentation never owns windows or statistical samples. */
import {comparisonPlotSeries,activePlotSeries} from './timeline-plot-series.js';
import {plotCoordinates} from './timeline-plot-coordinates.js';

export function renderComparisonPlot({host,legend,slots,layouts,mode,assetColor,date}){
 if(!host||!slots.length)return;
 const w=Math.max(320,host.clientWidth||800),h=280,p={l:48,r:18,t:20,b:34};
 const plotted=comparisonPlotSeries(slots,slot=>layouts[slot.slotIndex]?.rows||[]);
 if(!plotted.length){
   host.innerHTML='<p class="analysis-layer-note">Não há observações suficientes para desenhar a comparação.</p>';
   if(legend)legend.innerHTML='';
   return;
 }
 const {curves}=plotCoordinates(plotted,layouts,mode);
 const all=activePlotSeries(curves).flatMap(x=>x.values);
 if(!all.length){
   host.innerHTML='<p class="analysis-layer-note">Preços inválidos para normalização em base 100.</p>';
   if(legend)legend.innerHTML='';
   return;
 }
 const lo=Math.log(Math.min(...all)),hi=Math.log(Math.max(...all));
 const line=curve=>curve.values.map((value,i)=>{
   const x=p.l+curve.x[i]*(w-p.l-p.r);
   const y=h-p.b-(Math.log(Math.max(.0001,value))-lo)/(hi-lo||1)*(h-p.t-p.b);
   return x.toFixed(2)+','+y.toFixed(2);
 }).join(' ');
 const polylines=curves.map(curve=>'<polyline points="'+line(curve)+'" class="cmp-line" style="stroke:'+assetColor(curve.slot.assetKey,curve.slot.slotIndex)+';opacity:'+(curve.reference?'0.27':'1')+';stroke-dasharray:'+(curve.reference?'5 6':'none')+'"/>').join('');
 const calendar=mode==='calendar';
 host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="Comparação de séries em base 100"><line x1="'+p.l+'" x2="'+p.l+'" y1="'+p.t+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h-p.b)+'" y2="'+(h-p.b)+'" class="cmp-axis"/><line x1="'+p.l+'" x2="'+(w-p.r)+'" y1="'+(h/2)+'" y2="'+(h/2)+'" class="cmp-grid"/>'+polylines+'<text x="'+p.l+'" y="'+(h-8)+'">'+(calendar?'Primeira data':'Início relativo')+'</text><text x="'+(w-p.r)+'" y="'+(h-8)+'" text-anchor="end">'+(calendar?'Última data':'Fim relativo')+'</text><text x="'+(p.l+6)+'" y="'+(h/2-6)+'">Base 100 · '+(calendar?'datas reais, bases individuais':'início de cada janela')+'</text></svg>';
 if(legend)legend.innerHTML=curves.map(({slot,rows,reference})=>'<span class="cmp-series-label"><span aria-hidden="true" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+assetColor(slot.assetKey,slot.slotIndex)+';margin-right:6px"></span>'+(slot.symbol||slot.name||slot.assetKey)+' · Janela '+(slot.slotIndex+1)+(reference?' · referência (fora da análise)':' · ativa')+' ('+date(rows[0].timestamp)+' → '+date(rows.at(-1).timestamp)+')</span>').join(' · ');
}
