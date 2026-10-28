/* Timeline toolbar: renders controls and wires UI callbacks only. */
const categoryLabels={crypto:'Cripto',stock:'Ações',index:'Índices',commodity:'Commodities',rates:'Juros','btc-etf':'ETFs',test:'Validação'};
export function renderTimelineToolbar({host,catalog,modes,viewport,slots,rowsInWindow,onAlignStart,onAlignSequential,onChart,onAdd}){
 if(!host)return;
 const categories={};
 catalog.forEach(asset=>{const category=asset.category||'other';(categories[category]||(categories[category]=[])).push(asset)});
 const menu=Object.entries(categories).map(([category,list])=>'<details class="cmp-add-category"><summary>'+(categoryLabels[category]||category)+'<span>'+list.length+'</span></summary><div class="cmp-add-category-list">'+list.map(asset=>'<div class="cmp-add-option"><span><strong>'+asset.symbol+'</strong><small>'+asset.name+'</small></span><button type="button" class="cmp-add-series" data-add-asset="'+asset.assetKey+'" aria-label="Adicionar '+asset.symbol+'" title="Adicionar '+asset.name+'">+</button></div>').join('')+'</div></details>').join('');
 host.innerHTML='<button type="button" id="cmp-add-toggle" class="cmp-mode-toggle" aria-expanded="false">＋ Adicionar ativo</button><button type="button" id="cmp-chart-mode" class="cmp-mode-toggle">▤ '+(modes.chart==='relative'?'Comparação relativa':'Calendário')+'</button><button type="button" id="cmp-align-start" class="cmp-mode-toggle">↤ Mesmo início</button><button type="button" id="cmp-align-sequential" class="cmp-mode-toggle">⇥ Sequencial</button>'+'<div id="cmp-add-menu" class="cmp-add-menu" hidden><div class="cmp-add-menu-head"><strong>ADICIONAR À INVESTIGAÇÃO</strong><small>Toque em + para criar uma nova timeline. Repetir ativos é permitido.</small></div>'+menu+'</div>';
 const toggle=host.querySelector('#cmp-add-toggle'),panel=host.querySelector('#cmp-add-menu');
 toggle?.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));});
 host.querySelector('#cmp-align-start')?.addEventListener('click',onAlignStart);\n host.querySelector('#cmp-align-sequential')?.addEventListener('click',onAlignSequential);
 host.querySelector('#cmp-page-prev')?.addEventListener('click',onPrevious);
 host.querySelector('#cmp-page-next')?.addEventListener('click',onNext);
 host.querySelector('#cmp-chart-mode')?.addEventListener('click',onChart);
 host.querySelectorAll('[data-add-asset]').forEach(button=>button.addEventListener('click',()=>onAdd(button.dataset.addAsset)));
}
