export function createDrawingController({elements,getInteraction,getActive,getStatus,studyController,studyInfo,attachFibonacciMenu,attachDrawingToolsMenu,onChanged=()=>{}}){
  let fibonacciCleanup=()=>{};
  let moreCleanup=()=>{};
  let deleteHoldTimer=null;
  let deleteHoldTriggered=false;

  const setToolbarMode=mode=>{
    const interaction=getInteraction();
    interaction?.setMode(mode);
    elements.selectButton?.classList.toggle('is-active',mode==='selection');
    elements.lineButton?.classList.toggle('is-active',mode==='drawing');
    elements.navButton?.classList.toggle('is-active',mode==='navigation');
    elements.horizontalButton?.classList.toggle('is-active',mode==='drawing'&&interaction?.getTool?.()==='horizontal');
    elements.verticalButton?.classList.toggle('is-active',mode==='drawing'&&interaction?.getTool?.()==='vertical');
    elements.fibonacciButton?.classList.toggle('is-active',mode==='drawing'&&interaction?.getTool?.()==='fibonacci');
    elements.moreButton?.classList.toggle('is-active',mode==='drawing'&&['rectangle','reference','channel','ruler','text'].includes(interaction?.getTool?.()));
  };

  const refreshActions=()=>{
    const manager=getActive()?.drawingManager;
    if(!manager)return;
    if(elements.undoButton)elements.undoButton.disabled=!manager.canUndo();
    if(elements.redoButton)elements.redoButton.disabled=!manager.canRedo();
    if(elements.deleteButton)elements.deleteButton.disabled=!manager.getDrawings().length;
  };

  const clearAll=()=>{
    const interaction=getInteraction();
    if(!getActive()?.drawingManager?.getDrawings?.().length)return false;
    if(!window.confirm('Apagar todos os desenhos?'))return false;
    const changed=interaction?.clearAll?.()||false;
    if(changed)onChanged();
    return changed;
  };

  const startDeleteHold=()=>{
    if(deleteHoldTimer)return;
    deleteHoldTriggered=false;
    deleteHoldTimer=window.setTimeout(()=>{deleteHoldTimer=null;deleteHoldTriggered=true;clearAll();},700);
  };
  const cancelDeleteHold=()=>{
    if(deleteHoldTimer){window.clearTimeout(deleteHoldTimer);deleteHoldTimer=null;}
  };

  const bind=()=>{
    elements.selectButton?.addEventListener('click',()=>{getInteraction()?.setTool('line');setToolbarMode('selection');});
    elements.lineButton?.addEventListener('click',()=>{getInteraction()?.setTool('line');setToolbarMode('drawing');});
    elements.navButton?.addEventListener('click',()=>setToolbarMode('navigation'));
    elements.horizontalButton?.addEventListener('click',()=>{getInteraction()?.setTool('horizontal');setToolbarMode('drawing');});
    elements.verticalButton?.addEventListener('click',()=>{getInteraction()?.setTool('vertical');setToolbarMode('drawing');});
    elements.moreButton?.addEventListener('contextmenu',event=>event.preventDefault());
    elements.undoButton?.addEventListener('click',()=>{const a=getActive();if(a?.drawingManager?.undo()){a.chart.draw();onChanged();refreshActions();}});
    elements.redoButton?.addEventListener('click',()=>{const a=getActive();if(a?.drawingManager?.redo()){a.chart.draw();onChanged();refreshActions();}});
    elements.deleteButton?.addEventListener('click',()=>{
      if(deleteHoldTriggered){deleteHoldTriggered=false;return;}
      if(getInteraction()?.getSelectedId?.()){getInteraction().deleteSelected();onChanged();}
    });
    elements.deleteButton?.addEventListener('pointerdown',startDeleteHold);
    ['pointerup','pointercancel','pointerleave'].forEach(type=>elements.deleteButton?.addEventListener(type,cancelDeleteHold));
    elements.colorInput?.addEventListener('input',()=>getInteraction()?.setColor(elements.colorInput.value));
    window.addEventListener('keydown',event=>{if(event.key!=='Delete'||event.repeat)return;if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement||event.target instanceof HTMLTextAreaElement)return;deleteHoldTriggered=false;deleteHoldTimer=window.setTimeout(()=>{deleteHoldTimer=null;deleteHoldTriggered=true;clearAll();},700);});
    window.addEventListener('keyup',event=>{if(event.key!=='Delete')return;cancelDeleteHold();if(!deleteHoldTriggered)getInteraction()?.getSelectedId?.()&&getInteraction().deleteSelected();deleteHoldTriggered=false;});
    fibonacciCleanup=attachFibonacciMenu({
      button:elements.fibonacciButton,
      onModeChange:mode=>getInteraction()?.setFibonacciMode?.(mode),
      onActivate:()=>{getInteraction()?.setTool('fibonacci');setToolbarMode('drawing');}
    });
    moreCleanup=attachDrawingToolsMenu({
      button:elements.moreButton,
      onStudyInfo:selection=>{
        const info=studyController.info(selection?.value);
        if(info)studyInfo.open(info);
      },
      onStudyLongPress:selection=>studyController.openConfig(selection?.value),
      onSelect:selection=>{
        if(selection?.type==='study'){studyController.toggle(selection.value);return;}
        if(['rectangle','reference','channel','ruler','text'].includes(selection)) {
          getInteraction()?.setTool(selection);
          setToolbarMode('drawing');
        }
      }
    });
    setToolbarMode('navigation');
  };

  const destroy=()=>{fibonacciCleanup?.();moreCleanup?.();cancelDeleteHold();};

  return Object.freeze({bind,destroy,setToolbarMode,refreshActions,clearAll});
}
