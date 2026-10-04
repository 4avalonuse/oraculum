const EVENT_COLORS={
  Crypto:'#d7d7d7',
  Macro:'#d5a84b',
  Regulation:'#6ea8dc',
  Liquidity:'#9b7bd8',
  Market:'#7fbf8f'
};

function eventCategory(event){
  return String(event?.category||'Other').trim()||'Other';
}

function eventColor(category){
  if(EVENT_COLORS[category])return EVENT_COLORS[category];
  const palette=['#d7d7d7','#d5a84b','#6ea8dc','#9b7bd8','#7fbf8f','#d27c9c'];
  let hash=0;
  for(const char of category)hash=(hash*31+char.charCodeAt(0))>>>0;
  return palette[hash%palette.length];
}

export function attachTimeline({dataClient,getActive,getActiveSymbol}){
  const $=s=>document.querySelector(s);
  let timelineEvents=[];
  let activeEventCategory='ALL';
  let selectedEventIds=new Set();

  function eventAppliesToAsset(event,symbol){
    const ids=Array.isArray(event?.assetIds)?event.assetIds:[];
    if(event?.scope==='global'||event?.scope==='market')return true;
    if(!ids.length)return false;
    const assetId=String(symbol||'').toLowerCase().replace(/-usd$/,'-usd');
    return ids.some(id=>String(id).toLowerCase()===assetId || String(id).toLowerCase()===String(symbol||'').toLowerCase());
  }

  function relevantEvents(){
    return timelineEvents.filter(event=>eventAppliesToAsset(event,getActiveSymbol?.()));
  }

  function renderTimeline(candles,viewport){
    const host=$('#timeline'),lines=$('#timeline-lines');
    if(!host||!lines||!candles.length)return;
    const state=viewport.getState();
    const min=state.x.min,max=state.x.max,span=max-min||1;
    const events=relevantEvents().filter(e=>selectedEventIds.has(String(e.id))&&e.timestamp>=min&&e.timestamp<=max&&(activeEventCategory==='ALL'||eventCategory(e)===activeEventCategory));
    host.innerHTML='';
    lines.innerHTML='';
    if(!events.length)return;
    const plotLeft=10,plotRight=58,plotWidth=Math.max(1,host.clientWidth-plotLeft-plotRight);
    events.forEach(event=>{
      const ratio=Math.max(0,Math.min(1,(event.timestamp-min)/span));
      const x=plotLeft+ratio*plotWidth;
      const line=document.createElement('div');
      line.className='timeline-line';
      line.style.left=x+'px';
      line.title=event.description||event.title||'Evento';
      lines.appendChild(line);
      const marker=document.createElement('div');
      marker.className='timeline-event';
      marker.style.left=x+'px';
      marker.title=(event.title||'Evento')+(event.description?' — '+event.description:'');
      marker.innerHTML='<span class="timeline-event-date">'+new Date(event.timestamp).toLocaleDateString('pt-BR')+'</span>';
      host.appendChild(marker);
    });
  }

  function renderEventMenu(){
    const menu=$('#event-menu');
    if(!menu)return;
    const scopedEvents=relevantEvents();
    const categories=[...new Set(scopedEvents.map(eventCategory))];
    const visibleEvents=activeEventCategory==='ALL'?scopedEvents:scopedEvents.filter(event=>eventCategory(event)===activeEventCategory);
    menu.innerHTML='';
    const head=document.createElement('div');
    head.className='event-menu-head';
    const selectedVisible=[...selectedEventIds].filter(id=>scopedEvents.some(event=>String(event.id)===id)).length;
    head.innerHTML='<span>EVENTOS</span><span class="event-menu-count">'+selectedVisible+'/'+scopedEvents.length+'</span>';
    menu.appendChild(head);
    const filters=document.createElement('div');
    filters.className='event-menu-filters';
    const allButton=document.createElement('button');
    allButton.className='event-filter'+(activeEventCategory==='ALL'?' active':'');
    allButton.innerHTML='<i></i>TODOS';
    allButton.addEventListener('click',()=>{activeEventCategory='ALL';renderEventMenu();});
    filters.appendChild(allButton);
    categories.forEach(category=>{
      const button=document.createElement('button');
      button.className='event-filter'+(activeEventCategory===category?' active':'');
      button.style.setProperty('--event-color',eventColor(category));
      button.innerHTML='<i></i>'+category.toUpperCase();
      button.addEventListener('click',()=>{activeEventCategory=category;renderEventMenu();});
      filters.appendChild(button);
    });
    menu.appendChild(filters);
    const list=document.createElement('div');
    list.className='event-menu-list';
    visibleEvents.forEach(event=>{
      const category=eventCategory(event);
      const row=document.createElement('button');
      row.className='event-row'+(selectedEventIds.has(String(event.id))?' selected':'');
      row.style.setProperty('--event-color',eventColor(category));
      row.innerHTML='<i></i><span class="event-row-date">'+new Date(event.timestamp).toLocaleDateString('pt-BR')+'</span><strong>'+String(event.title||'Evento')+'</strong><span class="event-row-state">'+(selectedEventIds.has(String(event.id))?'ON':'OFF')+'</span>';
      row.title=event.description||event.title||'Evento';
      row.addEventListener('click',()=>{
        const id=String(event.id);
        if(selectedEventIds.has(id))selectedEventIds.delete(id);else selectedEventIds.add(id);
        renderEventMenu();
        const current=getActive?.();
        if(current?.candles&&current?.viewport)renderTimeline(current.candles,current.viewport);
      });
      list.appendChild(row);
    });
    menu.appendChild(list);
  }

  async function loadEvents(){
    try{
      timelineEvents=(await dataClient.loadEvents()).sort((a,b)=>a.timestamp-b.timestamp);
      selectedEventIds=new Set(timelineEvents.map(event=>String(event.id)));
      renderEventMenu();
    }catch(error){
      console.error('[ORACULUM TIMELINE]',error);
      timelineEvents=[];
    }
  }

  loadEvents();
  return {renderTimeline,loadEvents,refreshMenu:renderEventMenu,getState:()=>({events:[...timelineEvents],category:activeEventCategory,selectedIds:new Set(selectedEventIds)})};
}
