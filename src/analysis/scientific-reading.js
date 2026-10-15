/* syntax fix */
/* ORACULUM — leitura científica contextual.
 * Converte os resultados calculados em uma interpretação cautelosa e específica
 * da investigação atual. Não recalcula estatísticas nem infere causalidade.
 */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}
function card(title, level, body, detail='') {
  return '<article class="science-card science-'+level+'"><span class="science-level">'+esc(level==='evidence'?'EVIDÊNCIA':level==='caution'?'ATENÇÃO':'LEITURA')+'</span><h4>'+esc(title)+'</h4><p>'+body+'</p>'+(detail?'<details><summary>Aprofundar</summary><div>'+detail+'</div></details>':'')+'</article>';
}
function strength(value) {
  if (!Number.isFinite(value)) return 'não estimada';
  const a=Math.abs(value);
  return a>=.7?'forte':a>=.3?'moderada':a>=.1?'fraca':'próxima de zero';
}
function pText(p) {
  if (!Number.isFinite(p)) return 'não disponível';
  return p<.001?'inferior a 0,001':p.toLocaleString('pt-BR',{maximumFractionDigits:3});
}
export function buildScientificReading(result, {fmt, pct, date}) {
  if (!result) return '';
  const series=Object.values(result.series||{}), primary=series[0], targets=series.slice(1);
  const relations=result.relations||[], model=result.explanatoryModel, diag=result.modelDiagnostics;
  const cards=[];
  const reference=esc(primary?.symbol||'referência não definida');
  const targetNames=targets.map(s=>esc(s.symbol)).join(', ')||'nenhum ativo comparado';
  cards.push(card('Qual é a pergunta desta análise?','reading',
    'Estamos investigando como os retornos de <b>'+reference+'</b> se comportam no período selecionado e como se associam a <b>'+targetNames+'</b>. A leitura combina performance individual, relações bivariadas e, quando estimável, regressão multivariada.',
    'Janela: <b>'+esc(date(result.rowsStart))+' → '+esc(date(result.rowsEnd))+'</b>. Intervalo solicitado: <b>'+esc(result.interval||'não informado')+'</b>. Retornos: <b>'+esc(result.returnMode==='simple'?'simples':'logarítmicos')+'</b>. O gráfico em base 100 é uma referência visual; não deve alterar as estatísticas da amostra.'));
  const gaps=Number(result.temporal?.gaps||0), shared=Number(result.temporal?.sharedRows||result.observations||0);
  if (gaps>0) {
    cards.push(card('A amostra tem intervalos temporais irregulares','caution',
      'Foram identificadas <b>'+fmt(gaps,0)+' lacunas acima de 1,5 dia</b> em '+fmt(shared,0)+' buckets comuns. Um retorno entre dois fechamentos observados pode acumular mais de um dia de mercado/calendário; não o interprete automaticamente como retorno diário de 24 horas.',
      'As relações são calculadas sobre buckets de calendário compartilhados. Isso evita comparar datas diferentes, mas não garante que os preços representem fechamentos simultâneos. A anualização e testes que pressupõem intervalos iguais precisam dessa ressalva.'));
  } else {
    cards.push(card('Como o tempo entra nos cálculos','reading',
      'As relações entre ativos usam buckets de calendário comuns. A ausência de lacunas detectadas não prova que os horários de fechamento dos mercados sejam economicamente simultâneos.',
      'O timestamp pode representar o rótulo do candle, e não o instante real de formação ou disponibilidade do preço.'));
  }
  for (const rel of relations) {
    const corr=rel.correlation, beta=rel.beta, rolling=rel.rolling;
    const sign=Number.isFinite(corr)?(corr>0?'positiva':corr<0?'negativa':'próxima de zero'):'indeterminada';
    const rollDiff=Number.isFinite(rolling)&&Number.isFinite(corr)?Math.abs(rolling-corr):NaN;
    let reading='A correlação é '+strength(corr)+' e '+sign+' ('+fmt(corr,3)+'). ';
    reading+='O beta '+(Number.isFinite(beta)?fmt(beta,3):'não estimado')+' descreve a sensibilidade do retorno de <b>'+esc(rel.target)+'</b> em relação ao retorno da referência <b>'+esc(rel.primary)+'</b>, nesta regressão bivariada.';
    const detail='Nesta relação bivariada, a série cuja variação é modelada = '+esc(rel.target)+'; a série usada como referência = '+esc(rel.primary)+'. O beta é Cov(referência, série modelada) / Var(referência). Correlação é simétrica; beta não é. R² = '+pct(rel.r2,2)+'. Isso descreve o par; o modelo multivariado, quando disponível, usa o ativo investigado como alvo. Nenhum desses números demonstra causalidade.';
    cards.push(card(rel.primary+' × '+rel.target,'evidence',reading,
      detail+(Number.isFinite(rollDiff)&&rollDiff>=.25?' <br><br>A correlação móvel final ('+fmt(rolling,3)+') difere visivelmente da correlação da amostra ('+fmt(corr,3)+'). Isso sugere que a associação pode variar no tempo; a janela móvel é exploratória e não prova mudança estrutural.':' A correlação móvel final é '+fmt(rolling,3)+'.')));
  }
  if (model?.available) {
    const tests=diag?.heteroskedasticity?.tests||[];
    const flagged=tests.filter(t=>t?.available&&Number.isFinite(t.pValue)&&t.pValue<.05);
    const irregular=diag?.temporalSpacing?.status==='IRREGULAR_INTERVALS';
    cards.push(card('O modelo multivariado tem ajuste amostral relevante','evidence',
      'O modelo associa conjuntamente os preditores selecionados aos retornos de <b>'+esc(model.target)+'</b>. O R² é <b>'+pct(model.r2,2)+'</b> ('+fmt(model.observations,0)+' observações): essa é uma medida de ajuste dentro da amostra, não uma prova de causalidade ou desempenho futuro.',
      'Os coeficientes são condicionais aos demais preditores incluídos. O teste F mostrado é convencional; os p-valores HAC dos coeficientes usam aproximação normal assintótica. São inferências diferentes e devem permanecer identificadas como tal.'));
    if (flagged.length) {
      cards.push(card('Há sinais de variância não constante','caution',
        flagged.map(t=>'<b>'+esc(t.method)+'</b> (p='+esc(pText(t.pValue))+')').join('; ')+'. Ao menos um teste rejeita, ao nível de 5%, sua hipótese nula específica.',
        'White e Breusch–Pagan investigam relações entre a variância residual e os preditores sob especificações auxiliares diferentes. ARCH-LM investiga dependência temporal nos resíduos ao quadrado. Resultados divergentes não são necessariamente contraditórios: os testes investigam alternativas distintas. HAC ajuda na inferência dos coeficientes, mas não torna o modelo automaticamente bem especificado.'));
    } else if (tests.length) {
      cards.push(card('Os testes não apontam evidência forte em todos os diagnósticos','reading',
        'Nenhum dos testes disponíveis rejeitou sua hipótese nula ao nível de 5%. Isso <b>não prova</b> que a variância seja constante nem que os resíduos satisfaçam todos os pressupostos.',
        'A conclusão depende do poder dos testes, da especificação auxiliar, do tamanho da amostra e da estrutura temporal.'));
    }
    if (irregular) cards.push(card('Diagnósticos residuais: números válidos, inferência limitada','caution',
      'O espaçamento dos resíduos foi classificado como irregular. DW e Ljung–Box podem ser reproduzidos numericamente, mas seus valores-p convencionais pressupõem condições temporais que esta amostra não garante.',
      'Use os resultados como descrição exploratória, não como veredito formal sobre autocorrelação. A concordância entre duas implementações confirma consistência aritmética, não validade dos pressupostos.'));
  } else {
    cards.push(card('O modelo multivariado não foi estimado','caution',
      esc(model?.reason||'Selecione variáveis explicativas e verifique se há observações suficientes.'),
      'A ausência de estimativa não deve ser substituída por coeficientes presumidos. Verifique alinhamento, valores finitos, variação dos dados e colinearidade.'));
  }
  cards.push(card('O que podemos afirmar — e o que não podemos','reading',
    'Podemos descrever padrões, quantificar associações e verificar se implementações reproduzem as mesmas contas. Não podemos concluir causalidade apenas com correlação, beta ou regressão observacional.',
    'Separe sempre três estados: <b>confirmado numericamente</b> (as contas concordam), <b>suspeito</b> (há um sinal que merece investigação) e <b>inconclusivo</b> (faltam dados ou pressupostos para decidir). Uma auditoria aritmética não valida automaticamente os dados de origem nem a interpretação econômica.'));
  return '<section class="scientific-reading"><div class="science-heading"><span>ORACULUM · LEITURA CIENTÍFICA</span><h3>O que os dados mostram — e o que ainda não demonstram</h3><p>Uma interpretação contextual desta investigação, em camadas: primeiro a leitura clara; depois, método, pressupostos e limites.</p></div><div class="science-cards">'+cards.join('')+'</div></section>';
}
