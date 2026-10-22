/* ORACULUM — interpretação contextual dos testes de variância.
 * Camada de leitura apenas: usa os resultados calculados, sem refazer testes.
 * Distingue hipótese de cada teste, evidência estatística e limites da inferência.
 */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}
function number(value, fmt) {
  return Number.isFinite(value) ? fmt(value, 3) : 'não disponível';
}
function pLabel(p) {
  if (!Number.isFinite(p)) return 'não disponível';
  if (p === 0) return '≈ 0 na precisão numérica do cálculo';
  if (p < 0.000001) return '< 0,000001';
  return p.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
}
function testMeaning(method, lag) {
  if (method === 'Breusch–Pagan' || method === 'Breusch-Pagan') {
    return {
      question: 'A variância dos resíduos está relacionada linearmente aos preditores?',
      null: 'A variância condicional não depende linearmente dos preditores.',
      interpretation: 'Um resultado significativo sugere que a dispersão dos erros se relaciona aos preditores na forma examinada pelo teste. Não identifica causalidade nem mede, sozinho, a gravidade prática.'
    };
  }
  if (method === 'White') {
    return {
      question: 'Há evidência de variância não constante em alternativas mais amplas?',
      null: 'A variância condicional é constante contra os termos auxiliares incluídos.',
      interpretation: 'O teste pode incluir preditores, quadrados e interações. Sua hipótese alternativa depende dos termos efetivamente construídos; graus de liberdade devem corresponder à regressão auxiliar usada.'
    };
  }
  return {
    question: 'Os resíduos ao quadrado apresentam dependência temporal até ' + lag + ' defasagens?',
    null: 'Não há efeito ARCH até a defasagem especificada.',
    interpretation: 'Um resultado significativo sugere que a magnitude dos erros passados contém informação sobre a variância condicional. Isso é compatível com agrupamentos de volatilidade, mas não escolhe automaticamente um modelo ARCH/GARCH.'
  };
}
function testCard(test, alpha, fmt) {
  const meaning = testMeaning(test.method, test.lag ?? test.df);
  if (!test.available) {
    return '<article class="variance-test variance-test-muted"><div class="variance-test-top"><h5>' + esc(test.method) + '</h5><span>INCONCLUSIVO</span></div><p>' + esc(test.reason || 'Teste indisponível.') + '</p><details><summary>Hipótese e método</summary><p>' + esc(meaning.null) + '</p><p>' + esc(meaning.interpretation) + '</p></details></article>';
  }
  const interpretable = Number.isFinite(test.pValue) && test.pValue >= 0 && test.pValue <= 1;
  const significant = interpretable && test.pValue < alpha;
  const status = !interpretable ? 'INCONCLUSIVO' : significant ? 'SINAL DETECTADO' : 'SEM SINAL FORTE';
  const statusClass = !interpretable ? 'variance-test-muted' : significant ? 'variance-test-signal' : 'variance-test-no-signal';
  const p = pLabel(test.pValue);
  const df = Number.isFinite(test.df) ? String(test.df) : '—';
  const lm = number(test.statistic, fmt);
  const n = Number.isFinite(test.n) ? test.n : null;
  const lagLine = /ARCH/i.test(test.method) ? '<span>Defasagens: <b>' + esc(test.lag ?? test.df ?? '—') + '</b></span>' : '';
  return '<article class="variance-test ' + statusClass + '"><div class="variance-test-top"><h5>' + esc(test.method) + '</h5><span>' + status + '</span></div><p class="variance-test-question">' + esc(meaning.question) + '</p><div class="variance-test-stats"><span>LM <b>' + esc(lm) + '</b></span><span>gl <b>' + esc(df) + '</b></span><span>p <b>' + esc(p) + '</b></span>' + lagLine + (n !== null ? '<span>n <b>' + esc(n) + '</b></span>' : '') + '</div><p>' + (!interpretable ? 'O valor-p não é válido ou não está disponível; não é possível classificar o resultado.' : significant ? 'Este teste rejeita sua hipótese nula ao nível de ' + esc((alpha * 100).toLocaleString('pt-BR')) + '%.' : 'Este teste não rejeita sua hipótese nula ao nível de ' + esc((alpha * 100).toLocaleString('pt-BR')) + '%. Isso não prova que a variância seja constante.') + '</p><details><summary>Hipótese e interpretação correta</summary><p><b>Hipótese nula:</b> ' + esc(meaning.null) + '</p><p>' + esc(meaning.interpretation) + '</p><p><b>Estatística:</b> ' + esc(test.formula || 'LM baseado em regressão auxiliar.') + '</p></details></article>';
}
export function buildHeteroskedasticityReading(diagnostics, { fmt } = {}) {
  const h = diagnostics?.heteroskedasticity;
  if (!h || !Array.isArray(h.tests) || !h.tests.length) return '';
  const alpha = Number.isFinite(h.alpha) ? h.alpha : 0.05;
  const available = h.tests.filter(t => t?.available && Number.isFinite(t.pValue));
  const flagged = available.filter(t => t.pValue < alpha);
  const invalid = h.tests.filter(t => t?.available && (!Number.isFinite(t.pValue) || t.pValue < 0 || t.pValue > 1));
  const summary = invalid.length
    ? 'Há resultados sem valor-p válido; esses testes são inconclusivos e não entram na síntese inferencial.'
    : !available.length
    ? 'Os testes não produziram resultados interpretáveis nesta amostra.'
    : flagged.length === available.length
      ? 'Sinais de variância não constante: ' + flagged.length + ' de ' + available.length + ' testes disponíveis detectaram evidência contra suas hipóteses nulas específicas.'
      : flagged.length
        ? 'Há sinais de variância não constante: ' + flagged.length + ' de ' + available.length + ' testes disponíveis detectaram evidência contra suas hipóteses nulas específicas.'
        : 'Nenhum teste disponível rejeitou sua hipótese nula ao nível escolhido; isso não comprova variância constante.';
  const cards = h.tests.map(t => testCard(t, alpha, fmt || ((v) => String(v)))).join('');
  const notes = (h.notes || []).map(note => '<li>' + esc(note) + '</li>').join('');
  const pText = p => !Number.isFinite(p) ? 'p não disponível' : p === 0 ? 'p ≈ 0 na precisão numérica' : 'p = ' + p.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
  const findings = h.tests.map(t => {
    if (!t?.available || !Number.isFinite(t.pValue) || t.pValue < 0 || t.pValue > 1) return '<li><b>' + esc(t?.method || 'Teste') + ':</b> inconclusivo — ' + esc(t?.reason || 'valor-p não disponível ou inválido; não há base para classificar a evidência') + '</li>';
    const significant = t.pValue < alpha;
    let text;
    if (/Breusch/i.test(t.method)) text = significant
      ? 'há evidência de que a variância residual se relaciona linearmente aos preditores examinados'
      : 'não foi detectada evidência suficiente da forma linear examinada';
    else if (/White/i.test(t.method)) text = significant
      ? 'há evidência contra variância constante na alternativa auxiliar construída, que inclui termos não lineares quando identificáveis'
      : 'não foi detectada evidência suficiente na alternativa auxiliar examinada';
    else text = significant
      ? 'há evidência de dependência temporal dos resíduos ao quadrado até ' + esc(t.lag ?? t.df) + ' defasagens, compatível com agrupamentos de volatilidade'
      : 'não foi detectada evidência suficiente de efeito ARCH até ' + esc(t.lag ?? t.df) + ' defasagens';
    return '<li><b>' + esc(t.method) + ':</b> ' + text + ' (' + esc(pText(t.pValue)) + ', gl = ' + esc(t.df) + ').</li>';
  }).join('');
  const nextStep = flagged.some(t => /ARCH/i.test(t.method))
    ? 'Investigue a sequência temporal dos resíduos ao quadrado e considere comparar modelos de volatilidade apenas se a frequência, o tamanho da amostra e o objetivo da análise justificarem essa complexidade.'
    : flagged.length
      ? 'Inspecione resíduos versus valores ajustados e por preditor; compare a inferência convencional com erros-padrão robustos adequados ao desenho temporal. Confirme a especificação antes de escolher uma correção.'
      : 'Mantenha o diagnóstico como ausência de evidência forte, não como prova de homocedasticidade. Examine também gráficos de resíduos e a plausibilidade dos pressupostos para o período e a frequência usados.';
  return '<section id="science-variance-diagnostics" class="variance-reading"><div class="variance-reading-heading"><span>DIAGNÓSTICO DA VARIÂNCIA</span><h4>O que os testes realmente dizem</h4><p>' + esc(summary) + '</p></div><div class="variance-test-grid">' + cards + '</div><div class="variance-reading-conclusion"><b>Interpretação dos resultados calculados</b><ul>' + findings + '</ul><b>Próximo passo sugerido</b><p>' + esc(nextStep) + '</p><p>Heterocedasticidade afeta principalmente a confiabilidade dos erros-padrão convencionais e da inferência; os coeficientes OLS não ficam automaticamente inválidos. Erros-padrão robustos, como HAC/Newey–West, podem ajudar sob suas hipóteses, mas não corrigem especificação errada, causalidade ausente ou espaçamento temporal irregular.</p><p>Os testes são complementares, não confirmações independentes: Breusch–Pagan examina uma forma linear, White uma alternativa auxiliar mais ampla e ARCH-LM dependência temporal dos resíduos ao quadrado. Resultados concordantes aumentam a coerência do diagnóstico, mas não substituem os pressupostos nem a inspeção dos resíduos.</p></div>' + (notes ? '<details class="variance-reading-notes"><summary>Notas metodológicas</summary><ul>' + notes + '</ul></details>' : '') + '</section>';
}
