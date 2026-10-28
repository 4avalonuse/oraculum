import {wireSummaryCopy} from './view/copy-results.js';
import {wireReportButtons} from './interpretation.js';
import {buildAuditReport} from './audit-report.js';
import {openModal} from './analysis-modal.js';
import {wireMetricHelp} from './metric-help.js';
import {openDataTable} from './data-table.js';
import {openInfo} from './explanations.js';
import {metric,statBlock,pct,fmt,date} from './view/formatters.js';

/* Conecta os controles de resultados ao DOM; o cálculo permanece no runner. */
export function mountComparisonResults({html,state,assets}){
 const $=selector=>document.querySelector(selector);
   $('#analysis-results').innerHTML=html;$('#analysis-results').classList.remove('is-hidden');$('#analysis-results').querySelectorAll('[data-science-target]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const layer=$('#scientific-reading-layer'),target=$('#'+link.dataset.scienceTarget);if(layer)layer.open=true;target?.scrollIntoView({behavior:'smooth',block:'start'});if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}}));$('#analysis-results').querySelectorAll('a[href="#scientific-reading-layer"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const layer=$('#scientific-reading-layer');if(layer){layer.open=true;layer.scrollIntoView({behavior:'smooth',block:'start'});}}));wireSummaryCopy($('#analysis-results'),{context:$('#analysis-context'),auditText:()=>buildAuditReport(state.result,state.series,state.rows,state.markers,{timelineRows:state.timelineRows,timelineSlots:state.timelineSlots})});wireReportButtons($('#analysis-results'),state.result,state.series);$('#full-analysis').classList.remove('is-hidden');$('#advanced-analysis').onclick=()=>openModal({focusAdvanced:true,result:state.result,metric,statBlock,pct,fmt,date});wireMetricHelp($('#analysis-results'));document.querySelector('#show-data-table')?.addEventListener('click',()=>{const tableAssets={...assets};for(const slot of state.commonSeries||[])tableAssets[slot.key]=assets[slot.assetKey]||slot;openDataTable({rows:state.rows?.slice(state.markers.start,state.markers.end+1)||[],keys:(state.commonSeries||[]).map(slot=>slot.key),assets:tableAssets,fmt,date})});document.querySelector('#show-method')?.addEventListener('click',()=>openInfo('MÉTODO'));
}
