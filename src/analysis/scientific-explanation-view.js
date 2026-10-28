import {buildScientificReading} from './scientific-reading.js';
import {buildMetricEducation} from './interpretation.js';
import {fmt,pct,date} from './view/formatters.js';

/* Conteúdo educativo e leitura científica, independente da interface. */
export function buildScientificExplanationMarkup(result,series){
 let html='';
   const scientificReading=buildScientificReading(result,{fmt,pct,date});
   if(scientificReading)html+='<details id="scientific-reading-layer" class="scientific-reading-layer"><summary><span><b>INVESTIGAR</b><strong>Leitura científica contextual</strong><small>O que os dados mostram, pressupostos e limites da conclusão</small></span><span class="scientific-reading-layer__symbol" aria-hidden="true">＋</span></summary>'+scientificReading+'</details>';
   html+=buildMetricEducation(result,series);
   html+='<div class="analysis-section-label">AVANÇADO</div><div class="advanced-teaser"><span>Mediana, melhor/pior período, covariância, alpha, correlação móvel e diagnóstico de lead/lag.</span><button id="advanced-analysis">VER ESTATÍSTICAS AVANÇADAS ↗</button></div>';
   html+=buildExplanatoryModelMarkup(result,series);

 return html;
}
