/* Painel de conferência numérica: apresenta evidências e limites sem alterar cálculos. */
export function buildNumericalValidationMarkup(result){
   const validation=result.modelValidation||{status:'NOT_CHECKED',passed:0,total:0,checks:[]};
   const validationState=validation.status==='BOTH_PATHS_AGREE'?'consistent':validation.status==='ALERT'?'alert':'pending';
   const validationLabel=validationState==='consistent'?'Conferência numérica consistente':validationState==='alert'?'Divergência numérica — investigar':'Conferência numérica pendente';
   const validationMessage=validation.message||(validationState==='consistent'?'As implementações comparadas produziram resultados compatíveis. Isso não confirma, por si só, a validade econômica do modelo.':validationState==='alert'?'Há uma divergência que precisa ser examinada antes de confiar neste resultado.':'Esta conferência ainda não foi concluída para o modelo atual.');
   const validationAction=validationState==='alert'
     ?'Próximo passo: abra os detalhes, localize as verificações marcadas como FAIL e investigue a divergência antes de interpretar o modelo.'
     :validationState==='pending'
       ?(result.explanatoryModel?.reason||'Próximo passo: confirme se há amostra comum suficiente e se o modelo pôde ser estimado antes de tirar conclusões multivariadas.')
       :'Próximo passo: use a leitura científica para revisar pressupostos, resíduos e limites; concordância numérica não comprova validade econômica.';
   return '<section class="analysis-validation is-'+validationState+'" role="status" aria-label="Conferência numérica"><div class="analysis-validation__head"><span class="analysis-validation__marker" aria-hidden="true">'+(validationState==='consistent'?'✓':validationState==='alert'?'!':'…')+'</span><div class="analysis-validation__summary"><strong>'+validationLabel+'</strong><span>'+validation.passed+'/'+validation.total+' verificações numéricas</span></div><details class="analysis-validation__details"><summary>Detalhes e limites</summary><p>'+validationMessage+'</p><ul>'+(validation.checks||[]).map(item=>'<li><span class="analysis-validation__check">'+item.status+'</span> · '+item.name+'</li>').join('')+'</ul><small>Esta é uma conferência entre implementações, não um benchmark externo independente. Ela não comprova validade econômica, causalidade nem adequação do modelo.</small></details><p class="analysis-validation__next-step">'+validationAction+' <a href="#scientific-reading-layer">Abrir leitura científica contextual ↗</a></p></div></section>';

}
