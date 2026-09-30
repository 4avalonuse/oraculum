export function createStudyController({definitions,status,getChart,anchor}){
  let configs=[];
  const cleanups={};

  const getConfigs=()=>configs.map(item=>({...item}));
  const setConfigs=next=>{
    configs=Array.isArray(next)?next.map(item=>({...item})):[];
    getChart()?.setStudies(configs);
  };

  const ensure=id=>{
    const definition=definitions[id];
    if(!definition)return null;
    let config=configs.find(item=>item.study===id);
    if(!config){
      config={...definition.defaultConfig};
      configs=[...configs,config];
      getChart()?.setStudies(configs);
    }
    return config;
  };

  const toggle=id=>{
    const definition=definitions[id];
    if(!definition)return;
    const existing=configs.find(item=>item.study===id);
    if(!existing){ensure(id);status.textContent=definition.activatedMessage;return;}
    const visible=existing.visible!==false;
    setConfigs(configs.map(item=>item.study===id?{...item,visible:!visible}:item));
    status.textContent=`${definition.label} ${visible?'ocultado':'mostrado'}`;
  };

  const attach=()=>{
    Object.entries(definitions).forEach(([id,{attach}])=>{
      cleanups[id]=attach({
        anchor,
        getConfig:()=>configs.find(item=>item.study===id)||null,
        onChange:next=>setConfigs(configs.map(item=>item.study===id?{...item,...next}:item))
      });
    });
    return cleanups;
  };

  const openConfig=id=>{
    ensure(id);
    cleanups[id]?.open?.(configs.find(item=>item.study===id));
    if(definitions[id])status.textContent=definitions[id].configMessage;
  };

  const info=id=>{
    const definition=definitions[id];
    if(!definition)return null;
    return {title:definition.infoTitle||definition.label,text:definition.infoText||'Informação não disponível.'};
  };

  const destroy=()=>Object.values(cleanups).forEach(cleanup=>cleanup?.destroy?.());

  return Object.freeze({attach,getConfigs,setConfigs,ensure,toggle,openConfig,info,destroy});
}
