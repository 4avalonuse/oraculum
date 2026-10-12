/* ORACULUM — copiar resultados sem dependências externas */
function plainText(node){
  const clone=node.cloneNode(true);
  clone.querySelectorAll('button,.copy-feedback,.copy-toolbar').forEach(el=>el.remove());
  return (clone.innerText||clone.textContent||'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
async function writeClipboard(value){
  const text=String(value||'').trim();
  if(!text)throw new Error('Não há resultados para copiar.');
  if(navigator.clipboard?.writeText){
    try{await navigator.clipboard.writeText(text);return;}catch(_){}
  }
  const field=document.createElement('textarea');
  field.value=text;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';field.style.pointerEvents='none';
  document.body.appendChild(field);field.select();field.setSelectionRange(0,field.value.length);
  const ok=document.execCommand?.('copy');field.remove();
  if(!ok)throw new Error('O navegador não permitiu copiar. Tente selecionar o texto manualmente.');
}
function button(label,getText,kind='copy-part'){
  const el=document.createElement('button');el.type='button';el.className='result-copy-button '+kind;el.textContent=label;
  el.addEventListener('click',async(event)=>{event.preventDefault();event.stopPropagation();
    const original=label;el.disabled=true;el.textContent='COPIANDO…';
    try{await writeClipboard(getText());el.textContent='COPIADO ✓';el.classList.add('copy-success');}
    catch(error){el.textContent='TENTAR NOVAMENTE';el.title=error.message;}
    finally{el.disabled=false;window.setTimeout(()=>{el.textContent=original;el.classList.remove('copy-success');},1800);}
  });
  return el;
}
export function wireSummaryCopy(container,{context=null,auditText=null}={}){
  if(!container)return;
  container.querySelectorAll('.copy-toolbar,.result-copy-button').forEach(el=>el.remove());
  const toolbar=document.createElement('div');toolbar.className='copy-toolbar';
  const all=button(auditText?'COPIAR PARA AUDITORIA':'COPIAR TUDO',()=>auditText?auditText():[context?plainText(context):'',plainText(container)].filter(Boolean).join('\n\n'),'copy-all');
  toolbar.append(all);container.prepend(toolbar);
  const headings=[...container.querySelectorAll('.analysis-section-label')];
  headings.forEach((heading,index)=>{
    const group=document.createElement('div');group.className='copy-section-group';
    let next=heading.nextSibling;
    while(next && !(next.nodeType===1&&next.classList.contains('analysis-section-label'))){
      const current=next;next=next.nextSibling;group.appendChild(current);
    }
    heading.after(group);
    heading.append(button('COPIAR PARTE',()=>[heading.textContent,plainText(group)].filter(Boolean).join('\n\n')));
  });
}
export function wireModalCopy(modal){
  const panel=modal?.querySelector('.analysis-modal-panel'),body=modal?.querySelector('.analysis-modal-body');
  if(!panel||!body)return;
  const header=panel.querySelector('header');
  if(header&&!header.querySelector('.copy-toolbar')){
    const toolbar=document.createElement('div');toolbar.className='copy-toolbar modal-copy-toolbar';
    toolbar.append(button('COPIAR TUDO',()=>plainText(body),'copy-all'));
    header.insertBefore(toolbar,header.querySelector('.analysis-close'));
  }
  body.querySelectorAll('.analysis-layer-detail').forEach(detail=>{
    if(detail.querySelector('.copy-part-detail'))return;
    const b=button('COPIAR ESTA CAMADA',()=>[detail.querySelector('summary')?.innerText||'',plainText(detail.querySelector('.analysis-detail-content')||detail)].filter(Boolean).join('\n\n'),'copy-part-detail');
    const summary=detail.querySelector('summary');if(summary)summary.append(b);
  });
  const intro=body.querySelector(':scope > section:not(.analysis-layer-detail)');
  if(intro&&!intro.querySelector('.copy-part-intro')){
    const b=button('COPIAR ESTA PARTE',()=>plainText(intro),'copy-part-intro');
    intro.querySelector('h3')?.append(b);
  }
}
