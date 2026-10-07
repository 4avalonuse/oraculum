/* ORACULUM — ajuda contextual das métricas */
import {openInfo} from './explanations.js';

export function wireMetricHelp(root=document){
  root.querySelectorAll('.metric-help').forEach(button=>{
    button.onclick=()=>openInfo(button.dataset.topic||'MÉTODO');
  });
}
