/* Séries visíveis no gráfico comparativo: referências nunca entram no conjunto analítico. */
export function comparisonPlotSeries(slots,readRows){
 return (Array.isArray(slots)?slots:[]).map(slot=>({
  slot,rows:readRows(slot),reference:slot.active===false
 })).filter(entry=>Array.isArray(entry.rows)&&entry.rows.length>=2);
}
export function activePlotSeries(entries){return entries.filter(entry=>!entry.reference);}
