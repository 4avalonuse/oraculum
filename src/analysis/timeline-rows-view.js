/* Presentation only: timeline row HTML, no state mutation or event handlers. */
export function timelineRowsMarkup({slots,layouts,assetColor,date}){
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const commonSpan=layouts[0]?.capacity||1;
  return slots.map((slot,i)=>{
     const w=slot.window,color=assetColor(slot.assetKey,i);
     // Each track is measured in the same shared frames, never in each asset's full native history.
     const layout=layouts[i];
     const left=clamp(layout.position/commonSpan*100,0,100);
     const right=clamp((layout.position+layout.visibleCount)/commonSpan*100,0,100);
     const incomplete=layout.incomplete;
     const visible=layout.visibleCount>0;
     const hiddenNotice=incomplete&&visible?' · '+layout.hiddenCount+' frames fora da escala':'';

     const days=Math.max(1,Math.round((Number(w?.durationMs)||0)/86400000)+1);
     const durationLabel=days>=1?days+' '+(days===1?'dia':'dias'):(w?.observations||0)+' candles';
     const label=(slot.symbol||slot.name||slot.assetKey)+' '+(i+1);
     const intervalLabel=w?.valid?date(w.start)+' — '+date(w.end)+' · '+durationLabel:'Período indisponível';
     const range=visible?'<div class="cmp-timeline-range" data-slot="'+i+'" style="--timeline-color:'+color+';left:'+left+'%;width:'+Math.max(0,right-left)+'%" role="slider" aria-label="Mover janela de '+label+'" aria-valuetext="'+intervalLabel+'" tabindex="0" title="'+(incomplete?'Janela parcialmente visível; duração preservada'+hiddenNotice:'Janela completa')+'"></div>': '<span class="cmp-timeline-duration" title="Janela fora da área visível">↗ '+layout.hiddenCount+' frames fora da vista · use Anterior/Próxima</span>';
     const handles=i===0?'<button type="button" class="cmp-timeline-handle handle-start" data-slot="0" data-edge="start" style="left:clamp(12px,'+left+'%,calc(100% - 12px))" aria-label="Ajustar data inicial do ativo principal" title="Arraste para ajustar o início"></button><button type="button" class="cmp-timeline-handle handle-end" data-slot="0" data-edge="end" style="left:clamp(12px,'+right+'%,calc(100% - 12px))" aria-label="Ajustar data final do ativo principal" title="Arraste para ajustar o fim"></button>':'';
     return '<section class="cmp-timeline-row" data-timeline-row="'+i+'" style="--timeline-color:'+color+';opacity:'+(slot.active===false?'0.45':'1')+'" aria-label="Linha temporal '+(i+1)+'"><div class="cmp-timeline-head"><div class="cmp-timeline-title"><span class="cmp-timeline-color" aria-hidden="true"></span><strong>'+label+'</strong></div><button type="button" class="cmp-mode-toggle cmp-timeline-active" data-active-slot="'+i+'" aria-pressed="'+(slot.active!==false)+'" '+(i===0?'disabled title="A referência principal permanece ativa"':'title="Alternar participação desta timeline na análise"')+'>'+(slot.active===false?'○ Referência':'● Ativa')+'</button><button type="button" class="cmp-mode-toggle" data-duplicate-slot="'+i+'" title="Duplicar ativo em nova janela" aria-label="Duplicar '+label+'">↓</button><button type="button" class="cmp-mode-toggle" data-remove-slot="'+i+'" '+(slots.length===1?'disabled ':'')+'title="Remover janela" aria-label="Remover '+label+'">×</button></div><div class="cmp-timeline-track" data-track="'+i+'"><div class="cmp-timeline-rail"></div>'+range+handles+'</div><div class="cmp-timeline-dates" aria-label="'+intervalLabel+'"><span>'+ (w?.valid?date(w.start):'—') +'</span><span class="cmp-timeline-duration">'+(w?.valid?durationLabel:'')+'</span><span>'+ (w?.valid?date(w.end):'—') +'</span></div></section>';
   }).join('');
   }
