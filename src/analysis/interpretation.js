/* ORACULUM — interpretação amigável e relatórios em duas camadas.
 * Limites são referências didáticas, nunca leis universais de mercado.
 */
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const n = (v,d=3) => Number.isFinite(v) ? v.toLocaleString('pt-BR',{maximumFractionDigits:d}) : 'não disponível';
const p = (v,d=2) => Number.isFinite(v) ? (v*100).toLocaleString('pt-BR',{maximumFractionDigits:d})+'%' : 'não disponível';
const date = v => Number.isFinite(v) ? new Date(v).toLocaleDateString('pt-BR',{timeZone:'UTC'}) : 'não disponível';
const metricLegend = (name, value, meaning, purpose, limits, drawing='') =>
  '<details class="metric-legend"><summary><b>O que significa?</b><span>'+esc(name)+'</span></summary><div class="metric-legend-body"><p><b>Em palavras simples:</b> '+meaning+'</p><p><b>Para que serve:</b> '+purpose+'</p>'+(drawing?'<div class="metric-mini-drawing" role="img" aria-label="'+esc(drawing.label)+'">'+drawing.html+'</div>':'')+'<p><b>Como ler este valor:</b> '+limits+'</p></div></details>';
function strength(c){if(!Number.isFinite(c))return 'não foi possível estimar';const a=Math.abs(c);return a>=.7?'forte nesta amostra':a>=.3?'moderada nesta amostra':a>=.1?'fraca nesta amostra':'próxima de zero nesta amostra'}
export function buildConclusion(result, series=[]) {
  if(!result)return '';
  const primary=series[0], x=primary&&result.series?.[primary.key], relations=result.relations||[], model=result.explanatoryModel;
  const findings=[];
  if(x&&Number.isFinite(x.total)) findings.push('No período, '+esc(primary.symbol)+' teve retorno acumulado de <b>'+p(x.total)+'</b>. '+(x.total>0?'O preço terminou acima do início; isso não significa que a trajetória tenha sido estável.':x.total<0?'O preço terminou abaixo do início.':'O preço terminou praticamente no nível inicial.'));
  if(x&&Number.isFinite(x.vol)) findings.push('A volatilidade anualizada estimada foi <b>'+p(x.vol)+'</b>. Ela resume a dispersão dos retornos e não prevê o tamanho do próximo movimento.');
  if(x&&Number.isFinite(x.drawdown)) findings.push('A maior queda de um pico até um vale foi <b>'+p(Math.abs(x.drawdown))+'</b>. É uma medida histórica de perda, não um limite máximo para perdas futuras.');
  if(relations.length){const strongest=relations.filter(r=>Number.isFinite(r.correlation)).sort((a,b)=>Math.abs(b.correlation)-Math.abs(a.correlation))[0];if(strongest)findings.push('Entre os pares testados, a associação mais forte em valor absoluto foi <b>'+esc(strongest.primary)+' × '+esc(strongest.target)+': '+n(strongest.correlation)+'</b> ('+strength(strongest.correlation)+'). Correlação não prova causa nem garante que a relação continue igual.')}
  if(model?.available) findings.push('O modelo linear teve R² de <b>'+p(model.r2)+'</b>: descreve quanto da variação do alvo foi ajustada dentro desta amostra. Não significa a mesma percentagem de acertos nem garante previsão fora dela.');
  const tests=result.modelDiagnostics?.heteroskedasticity?.tests||[];
  const valid=tests.filter(t=>t?.available&&Number.isFinite(t.pValue)&&t.pValue>=0&&t.pValue<=1);
  const flagged=valid.filter(t=>t.pValue<(result.modelDiagnostics?.heteroskedasticity?.alpha??.05));
  if(valid.length) findings.push(flagged.length ? '<b>Atenção à inferência:</b> '+flagged.length+' de '+valid.length+' testes de variância detectaram evidência contra suas hipóteses nulas específicas. Isso não invalida automaticamente os coeficientes, mas recomenda cautela com erros-padrão e pressupostos.' : 'Os testes disponíveis não detectaram evidência forte contra suas hipóteses nulas ao nível escolhido. Isso não prova que a variância seja constante.');
  const validation=result.modelValidation;
  findings.push(validation?.status==='BOTH_PATHS_AGREE' ? 'A conferência numérica indica concordância entre os dois caminhos de cálculo avaliados. Isso confirma consistência aritmética nesses itens, não a qualidade dos dados ou a validade econômica do modelo.' : validation?.status==='ALERT' ? '<b>Revisão necessária:</b> os caminhos de cálculo divergiram em uma ou mais verificações.' : 'A conferência independente ainda não confirma todos os cálculos; trate os resultados como provisórios até validar.');
  const status=validation?.status==='ALERT'||flagged.length?'ATENÇÃO AOS LIMITES':validation?.status==='BOTH_PATHS_AGREE'?'LEITURA COM RESSALVAS':'RESULTADO PROVISÓRIO';
  return '<section class="analysis-conclusion"><div class="conclusion-eyebrow">EM POUCAS PALAVRAS</div><h3>Conclusão desta investigação</h3><p class="conclusion-status">'+status+'</p><ul>'+findings.map(t=>'<li>'+t+'</li>').join('')+'</ul><p class="conclusion-foot">“Bom” ou “ruim” depende da pergunta, do risco aceito e do período. Não existe um único valor universalmente bom para correlação, beta, volatilidade ou R².</p></section>';
}
export function buildMetricEducation(result, series=[]) {
  const primary=series[0], x=primary&&result?.series?.[primary.key];
  if(!x)return '';
  const rows=[];
  rows.push(metricLegend('Retorno acumulado',x.total,'Quanto o preço mudou entre o início e o fim.','Ver o resultado total do período, sem esconder a trajetória no meio.', 'Positivo significa que terminou acima do início; negativo, abaixo. Não mostra o caminho nem o risco sofrido.'));
  rows.push(metricLegend('Volatilidade',x.vol,'O quanto os retornos oscilaram, anualizado conforme a frequência usada.','Comparar a intensidade típica das oscilações entre ativos e períodos.', 'Mais alta significa maior dispersão, não necessariamente pior investimento. Compare apenas frequências e métodos compatíveis.',{label:'Exemplo esquemático de baixa e alta oscilação',html:'<svg viewBox="0 0 260 62" role="img" aria-label="Linha calma e linha oscilante" width="100%" height="62"><path d="M8 31 L252 31" stroke="currentColor" opacity=".25" fill="none"/><path d="M8 32 L48 29 L88 33 L128 30 L168 32 L208 29 L252 31" stroke="#67c7ff" stroke-width="2" fill="none"/><path d="M8 32 L28 8 L48 49 L68 18 L88 54 L108 11 L128 45 L148 15 L168 52 L188 8 L208 43 L228 17 L252 35" stroke="#f2c94c" stroke-width="2" fill="none"/><text x="10" y="60" fill="currentColor" font-size="9">azul: menor dispersão · amarelo: maior</text></svg>'}));
  rows.push(metricLegend('Drawdown máximo',x.drawdown,'A maior queda de um pico anterior até um vale posterior.','Entender a pior queda histórica dentro da janela analisada.','Uma queda de 30% exige alta de cerca de 42,9% para voltar ao nível anterior. O histórico não limita perdas futuras.'));
  rows.push(metricLegend('Correlação',result.relations?.[0]?.correlation,'Se dois ativos tenderam a subir e cair juntos nos mesmos intervalos.','Investigar associação e possível diversificação; correlação baixa pode ajudar, mas não garante proteção.','Vai de −1 a +1. Perto de +1: andam juntos; perto de −1: tendem a sentidos opostos; perto de 0: pouca relação linear. O padrão pode mudar.',{label:'Exemplos de correlação',html:'<svg viewBox="0 0 260 74" role="img" aria-label="Exemplos de movimentos juntos e opostos" width="100%" height="74"><path d="M8 36 L252 36" stroke="currentColor" opacity=".2"/><path d="M8 30 L48 19 L88 25 L128 12 L168 18 L208 7 L252 14" stroke="#67c7ff" fill="none" stroke-width="2"/><path d="M8 43 L48 52 L88 46 L128 59 L168 53 L208 64 L252 57" stroke="#f2c94c" fill="none" stroke-width="2"/><text x="10" y="72" fill="currentColor" font-size="9">linhas opostas = exemplo negativo, não previsão</text></svg>'}));
  const r=result.relations?.[0];
  if(r) rows.push(metricLegend('Beta',r.beta,'Quanto o retorno do ativo-alvo variou em associação com o retorno da referência no modelo linear.','Comparar sensibilidade estimada entre ativos no período observado.','Beta 1 sugere sensibilidade unitária; acima de 1, maior resposta estimada na mesma direção; negativo, direção oposta. Não é multiplicador exato em cada dia nem prova de causa.'));
  rows.push(metricLegend('VaR e ES',x.var95,'VaR estima um quantil de perda; ES resume a perda média na cauda além desse quantil.','Avaliar cenários ruins de cauda e comparar risco extremo sob a mesma convenção.','VaR 95% não é a perda máxima: sob a definição usada, cerca de 5% dos retornos ficam além do limite estimado. ES depende de dados, amostra e método; eventos extremos podem exceder ambos.'));
  if(modelValue(result)) rows.push(metricLegend('R² do modelo',result.explanatoryModel.r2,'Quanto da variação observada do alvo o modelo ajusta dentro da amostra.','Avaliar ajuste conjunto, sempre junto de resíduos, validação e objetivo.','R² alto não prova causalidade nem previsão futura; R² baixo não torna automaticamente inútil um modelo de risco ou inferência.'));
  return '<section class="metric-education"><h3>Guia rápido dos indicadores</h3><p>Abra só o indicador que quer entender. As faixas são referências de leitura, não regras universais.</p>'+rows.join('')+'</section>';
}
function modelValue(result){return result.explanatoryModel?.available}
function reportCore(result,series=[]) {
  const primary=series[0], x=primary&&result?.series?.[primary.key], lines=[];
  lines.push('ORACULUM · '+(primary?.symbol||'ANÁLISE'),'Período: '+date(result?.rowsStart)+' a '+date(result?.rowsEnd)+' | intervalo '+(result?.interval||'não informado')+' | n comum '+(result?.observations??'—'),'Retornos: '+(result?.returnMode==='simple'?'simples':'logarítmicos')+' | janela móvel '+(result?.rollingWindow??'—'));
  if(x)lines.push('Retorno acumulado '+p(x.total)+' | CAGR '+p(x.cagr)+' | volatilidade anualizada '+p(x.vol)+' | drawdown máximo '+p(x.drawdown)+' | Sharpe '+n(x.sharpe)+' | VaR95 '+p(x.var95)+' | ES95 '+p(x.es95));
  for(const r of result?.relations||[])lines.push('Relação '+r.primary+' × '+r.target+': correlação '+n(r.correlation)+' | beta alvo/referência '+n(r.beta)+' | R² bivariado '+p(r.r2)+' | rolling final '+n(r.rolling));
  const m=result?.explanatoryModel;
  if(m?.available){lines.push('Modelo linear: alvo '+m.target+' | preditores '+(m.predictors||[]).join(', ')+' | n '+m.observations+' | R² '+p(m.r2)+' | R² ajustado '+p(m.adjustedR2));for(const c of m.coefficients||[])lines.push('OLS '+c.name+': beta '+n(c.beta,6)+' | SE '+n(c.se,6)+' | p '+n(c.p,6));for(const c of m.hacCoefficients||[])lines.push('HAC '+c.name+': beta '+n(c.beta,6)+' | SE HAC '+n(c.hacSe,6)+' | p HAC '+(c.hacP===0?'< limite numérico':n(c.hacP,8)))}
  const h=result?.modelDiagnostics?.heteroskedasticity;
  if(h?.tests?.length)for(const t of h.tests)lines.push(t.method+': '+(!t.available?'inconclusivo ('+t.reason+')':'LM '+n(t.statistic)+' | gl '+(t.df??'—')+' | p '+(t.pValue===0?'< limite numérico':n(t.pValue,8))+' | '+(t.pValue<(h.alpha??.05)?'sinal contra H0':'sem rejeição de H0')));
  lines.push('Validação numérica: '+(result?.modelValidation?.status||'não verificada')+' ('+(result?.modelValidation?.passed??0)+'/'+(result?.modelValidation?.total??0)+')','Limites: associação não prova causalidade; estatísticas históricas não garantem resultados futuros; “sem rejeição” não prova a hipótese nula.');
  return lines;
}
export function buildTechnicalReport(result,series=[]) {
  return [...reportCore(result,series),'','AUDITORIA SOLICITADA','Confira fórmulas, alinhamento temporal, anualização, VaR/ES, beta, R², OLS/HAC e diagnósticos. Classifique cada achado como confirmado, suspeito ou inconclusivo; peça dados/código adicional somente se necessário.'].join('\n');
}
export function buildScientificReport(result,series=[]) {
  const lines=reportCore(result,series), primary=series[0], x=primary&&result?.series?.[primary.key], rel=result?.relations||[], model=result?.explanatoryModel;
  lines.push('','CONCLUSÃO EM LINGUAGEM SIMPLES');
  if(x) lines.push('O ativo '+primary.symbol+' terminou '+(x.total>0?'acima':x.total<0?'abaixo':'próximo')+' do preço inicial ('+p(x.total)+'). A volatilidade estimada foi '+p(x.vol)+' e o drawdown máximo '+p(Math.abs(x.drawdown))+'.');
  for(const r of rel)lines.push('A correlação entre '+r.primary+' e '+r.target+' foi '+n(r.correlation)+' ('+strength(r.correlation)+'); isso descreve associação no período e não prova causalidade.');
  if(model?.available)lines.push('O R² de '+p(model.r2)+' indica ajuste dentro da amostra, não percentagem de previsões corretas nem garantia futura.');
  const tests=result?.modelDiagnostics?.heteroskedasticity?.tests||[], valid=tests.filter(t=>t?.available&&Number.isFinite(t.pValue)&&t.pValue>=0&&t.pValue<=1), flagged=valid.filter(t=>t.pValue<(result.modelDiagnostics.heteroskedasticity.alpha??.05));
  if(valid.length)lines.push(flagged.length?'Os testes de variância levantaram alerta em '+flagged.length+'/'+valid.length+' resultados; a inferência precisa de cautela.':'Os testes disponíveis não rejeitaram suas hipóteses nulas; isso não comprova variância constante.');
  lines.push('UTILIDADE: estes resultados ajudam a descrever retorno, risco e associações históricas. Para decisão prática, combine com objetivo, horizonte, liquidez, custos e tolerância a perdas. Não são recomendação de compra/venda.');
  return lines.join('\n');
}

export function wireReportButtons(container,result,series=[]) {
  if(!container)return;
  container.querySelector('.copy-toolbar')?.remove();
  container.querySelector('.report-actions')?.remove();
  const bar=document.createElement('div');bar.className='report-actions';
  const write=async(text,button,label)=>{
    button.disabled=true;button.textContent='PREPARANDO…';
    try{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);}
      else {const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();const ok=document.execCommand?.('copy');field.remove();if(!ok)throw new Error('Cópia não autorizada pelo navegador.');}
      button.textContent='COPIADO ✓';button.classList.add('report-done');
    }catch(error){button.textContent='NÃO FOI POSSÍVEL COPIAR';button.title=error.message;}
    finally{button.disabled=false;window.setTimeout(()=>{button.textContent=label;button.classList.remove('report-done')},2200);}
  };
  for(const [label,sub,build] of [
    ['RELATÓRIO TÉCNICO ENXUTO','Números, método e pontos para Ava conferir',buildTechnicalReport],
    ['RELATÓRIO CIENTÍFICO','Interpretação, limites e conclusão',buildScientificReport]
  ]){
    const b=document.createElement('button');b.type='button';b.className='report-action';b.innerHTML=esc(label)+'<small>'+esc(sub)+'</small>';
    b.addEventListener('click',()=>write(build(result,series),b,label));bar.appendChild(b);
  }
  container.append(bar);
}
