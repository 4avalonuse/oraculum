/* ORACULUM — elegibilidade científica, sem dependência de interface.
 * Avalia somente o que é demonstrável com os metadados recebidos.
 * Não infere causalidade, frequência, preenchimento ou sincronização.
 */
export const EligibilityStatus=Object.freeze({
  ADEQUATE:'adequado',
  CAUTION:'adequado_com_ressalvas',
  INADEQUATE:'inadequado'
});

const finite=x=>Number.isFinite(x);
const uniqueSorted=values=>[...new Set(values)].sort((a,b)=>a-b);

export function inspectTimelineContext(timelines,{minimumObservations=10}={}){
  const min=Math.max(2,Math.floor(Number(minimumObservations)||10));
  const active=(Array.isArray(timelines)?timelines:[]).filter(t=>t?.active!==false);
  const issues=[];
  const series=active.map((t,index)=>{
    const timestamps=(Array.isArray(t?.timestamps)?t.timestamps:[])
      .map(Number).filter(finite);
    const unique=uniqueSorted(timestamps);
    if(unique.length!==timestamps.length)issues.push({code:'INVALID_OR_DUPLICATE_DATES',timeline:index});
    if(unique.length<min)issues.push({code:'INSUFFICIENT_OBSERVATIONS',timeline:index});
    return {id:t?.id??String(index),timestamps:unique,observations:unique.length,
      start:unique[0]??null,end:unique.at(-1)??null};
  });
  const intersection=series.length?series.reduce((acc,s)=>acc.filter(t=>s.timestamps.includes(t)),series[0].timestamps):[];
  return {activeCount:series.length,series,commonObservations:intersection.length,
    commonStart:intersection[0]??null,commonEnd:intersection.at(-1)??null,
    issues,minimumObservations:min};
}

export function evaluateMethodEligibility(context,method){
  const reasons=[];
  if(!context||!Array.isArray(context.series))return {status:EligibilityStatus.INADEQUATE,reasons:['INVALID_CONTEXT']};
  const min=context.minimumObservations??10;
  const series=context.series;
  if(!series.length)return {status:EligibilityStatus.INADEQUATE,reasons:['NO_ACTIVE_TIMELINES']};
  if(series.some(s=>s.observations<min))reasons.push('INSUFFICIENT_OBSERVATIONS');
  if(method==='contemporaneous_correlation'){
    if(series.length<2)reasons.push('REQUIRES_TWO_TIMELINES');
    if(context.commonObservations<min)reasons.push('INSUFFICIENT_ALIGNED_OBSERVATIONS');
  }else if(method==='relative_trajectory'){
    if(series.length<2)reasons.push('REQUIRES_TWO_TIMELINES');
  }else return {status:EligibilityStatus.INADEQUATE,reasons:['UNKNOWN_METHOD']};
  if(reasons.length)return {status:EligibilityStatus.INADEQUATE,reasons};
  const warnings=[];
  if(context.issues?.some(i=>i.code==='INVALID_OR_DUPLICATE_DATES'))warnings.push('DATE_QUALITY_REQUIRES_REVIEW');
  if(method==='relative_trajectory')warnings.push('RELATIVE_ALIGNMENT_IS_NOT_CONTEMPORANEITY');
  return {status:warnings.length?EligibilityStatus.CAUTION:EligibilityStatus.ADEQUATE,reasons:warnings};
}
