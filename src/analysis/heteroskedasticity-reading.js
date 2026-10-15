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
  const significant = Number.isFinite(test.pValue) && test.pValue < alpha;
  const status = significant ? 'SINAL DETECTADO' : 'SEM SINAL FORTE';
  const statusClass = significant ? 'variance-test-signal' : 'variance-test-no-signal';
  const p = pLabel(test.pValue);
  const df = Number.isFinite(test.df) ? String(test.df) : '—';
  const lm = number(test.statistic, fmt);
  const n = Number.isFinite(test.n) ? test.n : null;
  const lagLine = /ARCH/i.test(test.method) ? '<span>Defasagens: <b>' + esc(test.lag ?? test.df ?? '—') + '</b></span>' : '';
  return '<article class="variance-test ' + statusClass + '"><div class="variance-test-top"><h5>' + esc(test.method) + '</h5><span>' + status + '</span></div><p class="variance-test-question">' + esc(meaning.question) + '</p><div class="variance-test-stats"><span>LM <b>' + esc(lm) + '</b></span><span>gl <b>' + esc(df) + '</b></span><span>p <b>' + esc(p) + '</b></span>' + lagLine + (n !== null ? '<span>n <b>' + esc(n) + '</b></span>' : '') + '</div><p>' + (significant ? 'Este teste rejeita sua hipótese nula ao nível de ' + esc((alpha * 100).toLocaleString('pt-BR')) + '%.' : 'Este teste não rejeita sua hipótese nula ao nível de ' + esc((alpha * 100).toLocaleString('pt-BR')) + '%. Isso não prova que a variância seja constante.') + '</p><details><summary>Hipótese e interpretação correta</summary><p><b>Hipótese nula:</b> ' + esc(meaning.null) + '</p><p>' + esc(meaning.interpretation) + '</p><p><b>Estatística:</b> ' + esc(test.formula || 'LM baseado em regressão auxiliar.') + '</p></details></article>';
}
export function buildHeteroskedasticityReading(diagnostics, { fmt } = {}) {
  const h = diagnostics?.heteroskedasticity;
  if (!h?.available || !Array.isArray(h.tests) || !h.tests.length) return '';
  const alpha = Number.isFinite(h.alpha) ? h.alpha : 0.05;
  const available = h.tests.filter(t => t?.available && Number.isFinite(t.pValue));
  const flagged = available.filter(t => t.pValue < alpha);
  const summary = !available.length
    ? 'Os testes não produziram resultados interpretáveis nesta amostra.'
    : flagged.length === available.length
      ? 'Todos os testes disponíveis detectaram evidência contra suas hipóteses nulas específicas.'
      : flagged.length
        ? flagged.length + ' de ' + available.length + ' testes disponíveis detectaram evidência contra suas hipóteses nulas específicas.'
        : 'Nenhum teste disponível rejeitou sua hipótese nula ao nível escolhido; isso não comprova variância constante.';
  const cards = h.tests.map(t => testCard(t, alpha, fmt || ((v) => String(v)))).join('');
  const notes = (h.notes || []).map(note => '<li>' + esc(note) + '</li>').join('');
  return '<section class="variance-reading"><div class="variance-reading-heading"><span>DIAGNÓSTICO DA VARIÂNCIA</span><h4>O que os testes realmente dizem</h4><p>' + esc(summary) + '</p></div><div class="variance-test-grid">' + cards + '</div><div class="variance-reading-conclusion"><b>Como usar esse resultado</b><p>Heterocedasticidade afeta principalmente a confiabilidade dos erros-padrão convencionais e da inferência. Os coeficientes OLS não ficam automaticamente inválidos. Erros-padrão robustos, como HAC/Newey–West, podem ajudar sob suas hipóteses, mas não corrigem especificação errada, causalidade ausente ou espaçamento temporal irregular.</p><p>Os testes são complementares, não três confirmações independentes: Breusch–Pagan examina uma forma linear, White uma alternativa auxiliar mais ampla e ARCH-LM dependência temporal dos resíduos ao quadrado.</p></div>' + (notes ? '<details class="variance-reading-notes"><summary>Notas metodológicas</summary><ul>' + notes + '</ul></details>' : '') + '</section>';
}
