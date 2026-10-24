/* ORACULUM — triagem científica de qualidade da amostra.
 * Funções puras; sem DOM, UI, persistência ou estimação de modelos.
 * Não substitui diagnósticos específicos de cada método.
 */
export const ScientificStatus=Object.freeze({APPROVED:'APPROVED',WARNING:'WARNING',BLOCKED:'BLOCKED'});

export function inspectWindowSamples(windows,{minObservations=10,requireEqualFrames=true}={}){
  const issues=[];
  if(!Array.isArray(windows)||windows.length===0)
    return {status:ScientificStatus.BLOCKED,issues:[{code:'NO_WINDOWS',status:ScientificStatus.BLOCKED,message:'Nenhuma janela selecionada.'}],sampleSizes:[]};
  const sampleSizes=windows.map(rows=>Array.isArray(rows)?rows.length:0);
  sampleSizes.forEach((count,index)=>{
    if(count<minObservations)issues.push({code:'INSUFFICIENT_SAMPLE',status:ScientificStatus.BLOCKED,window:index,observations:count,message:'Janela com amostra insuficiente.'});
    const rows=Array.isArray(windows[index])?windows[index]:[];
    const times=rows.map(row=>Number(row?.timestamp));
    if(times.some(t=>!Number.isFinite(t))||times.some((t,i)=>i>0&&t<=times[i-1]))
      issues.push({code:'INVALID_TIME_ORDER',status:ScientificStatus.BLOCKED,window:index,message:'Datas inválidas, repetidas ou fora de ordem.'});
  });
  if(requireEqualFrames&&new Set(sampleSizes).size>1)
    issues.push({code:'FRAME_COUNT_MISMATCH',status:ScientificStatus.BLOCKED,message:'Janelas com números de frames diferentes.'});
  return {status:issues.some(x=>x.status===ScientificStatus.BLOCKED)?ScientificStatus.BLOCKED:ScientificStatus.APPROVED,issues,sampleSizes};
}

/* Só aprova inferência entre séries com amostra efetivamente pareada por calendário.
 * Alinhamento por posição/tempo relativo nunca é prova de contemporaneidade.
 */
export function inspectCalendarInference({seriesCount=0,alignedRows=[],minObservations=10}={}){
  const issues=[];
  if(seriesCount<2)issues.push({code:'NOT_MULTIVARIATE',status:ScientificStatus.BLOCKED,message:'São necessárias pelo menos duas séries distintas.'});
  if(!Array.isArray(alignedRows)||alignedRows.length<minObservations)
    issues.push({code:'NO_COMMON_SAMPLE',status:ScientificStatus.BLOCKED,message:'Amostra de calendário comum insuficiente.'});
  if(Array.isArray(alignedRows)&&alignedRows.some(row=>!row?.__periodKey))
    issues.push({code:'MISSING_CALENDAR_KEY',status:ScientificStatus.BLOCKED,message:'Pareamento de calendário não comprovado.'});
  return {status:issues.length?ScientificStatus.BLOCKED:ScientificStatus.APPROVED,issues,alignedObservations:Array.isArray(alignedRows)?alignedRows.length:0};
}
