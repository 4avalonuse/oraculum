/* ORACULUM — proveniência e auditoria das estatísticas.
 * Este carimbo documenta a origem de um cálculo e verifica identidades internas.
 * CONSISTENT_INTERNAL não significa validação independente nem validade econômica.
 */
export const ANALYSIS_MATH_VERSION = '1.1.0';

export function calculationStamp({
  id, formula, inputs = [], observations = null, sample = null,
  assumptions = [], checks = []
}) {
  const failed = checks.filter(check => check.status === 'FAIL');
  return {
    id,
    mathVersion: ANALYSIS_MATH_VERSION,
    formula,
    inputs,
    observations,
    sample,
    assumptions,
    checks,
    status: failed.length ? 'ALERT' : checks.length ? 'CONSISTENT_INTERNAL' : 'NOT_CHECKED',
    validationScope: 'internal-consistency-only',
    independentlyValidated: false
  };
}

const closeEnough = (a, b, tolerance = 1e-9) =>
  Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));

function check(name, actual, expected, tolerance) {
  const comparable = Number.isFinite(actual) && Number.isFinite(expected);
  const pass = comparable && closeEnough(actual, expected, tolerance);
  return {
    name, status: !comparable ? 'NOT_COMPARABLE' : pass ? 'PASS' : 'FAIL',
    actual: Number.isFinite(actual) ? actual : null,
    expected: Number.isFinite(expected) ? expected : null,
    tolerance
  };
}

function referencePairStats(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return null;
  const pairs = [];
  for (let i = 0; i < a.length; i++) {
    if (Number.isFinite(a[i]) && Number.isFinite(b[i])) pairs.push([a[i], b[i]]);
  }
  if (pairs.length < 2) return { n: pairs.length, covariance: NaN, varianceX: NaN, correlation: NaN, beta: NaN, alpha: NaN, r2: NaN };
  const mx = pairs.reduce((sum, p) => sum + p[0], 0) / pairs.length;
  const my = pairs.reduce((sum, p) => sum + p[1], 0) / pairs.length;
  let xx = 0, yy = 0, xy = 0;
  for (const [x, y] of pairs) {
    xx += (x - mx) ** 2;
    yy += (y - my) ** 2;
    xy += (x - mx) * (y - my);
  }
  const varianceX = xx / (pairs.length - 1);
  const covariance = xy / (pairs.length - 1);
  const correlation = xx > 0 && yy > 0 ? xy / Math.sqrt(xx * yy) : NaN;
  const beta = varianceX > 0 ? covariance / varianceX : NaN;
  const alpha = Number.isFinite(beta) ? my - beta * mx : NaN;
  return { n: pairs.length, covariance, varianceX, correlation, beta, alpha, r2: Number.isFinite(correlation) ? correlation ** 2 : NaN };
}

export function auditAnalysis(result, series) {
  const seriesAudit = {};
  for (const item of series) {
    const s = result.series?.[item.key];
    if (!s) continue;
    const validReturns = (s.returns || []).filter(Number.isFinite);
    const priceCount = s.nativeObservations ?? result.observations;
    const sample = { start: s.rowsStart ?? result.rowsStart ?? null, end: s.rowsEnd ?? result.rowsEnd ?? null, basis: s.returnHorizon ?? 'shared sample' };
    const calculations = {
      totalReturn: calculationStamp({
        id: item.key + '.total-return',
        formula: 'P_fim / P_início − 1',
        inputs: ['start', 'end'], observations: priceCount, sample,
        assumptions: ['Preços inicial e final positivos; mesma série e amostra.'],
        checks: [check('retorno acumulado', s.total, s.end / s.start - 1, 1e-10)]
      }),
      cagr: calculationStamp({
        id: item.key + '.cagr',
        formula: '(P_fim / P_início)^(1/anos) − 1',
        inputs: ['start', 'end', 'years'], observations: priceCount, sample,
        assumptions: ['Anos calculados pelo intervalo temporal da amostra; mínimo de um período anualizado.'],
        checks: []
      }),
      volatility: calculationStamp({
        id: item.key + '.annualized-volatility',
        formula: 'desvio-padrão amostral dos retornos × √períodos_por_ano',
        inputs: ['returns', 'periods'], observations: validReturns.length, sample,
        assumptions: ['Desvio-padrão amostral (n−1); anualização depende do calendário selecionado.'],
        checks: [check('volatilidade anualizada', s.vol, s.std * Math.sqrt(s.annualizationPeriods ?? result.periods), 1e-10)]
      }),
      distribution: calculationStamp({
        id: item.key + '.return-distribution',
        formula: 'estatísticas descritivas sobre retornos finitos',
        inputs: ['returns'], observations: validReturns.length, sample,
        assumptions: ['Retornos não finitos são excluídos; a primeira observação nativa não produz retorno. Relações usam separadamente retornos da amostra comum.'],
        checks: []
      }),
      risk: calculationStamp({
        id: item.key + '.risk-metrics',
        formula: 'VaR/ES históricos; Sharpe/Sortino anualizados; Calmar condicionado ao drawdown',
        inputs: ['returns', 'periods', 'drawdown', 'options'], observations: validReturns.length, sample,
        assumptions: ['VaR/ES são apresentados como perda positiva ou negativa conforme a cauda observada; retornos todos positivos podem gerar VaR negativo.'],
        checks: []
      })
    };
    seriesAudit[item.key] = {
      observations: priceCount,
      validReturns: validReturns.length,
      calculations
    };
  }
  const relationAudit = (result.relations || []).map(r => {
    const x = result.series?.[r.primary]?.alignedReturns || result.series?.[r.primary]?.returns || [];
    const y = result.series?.[r.target]?.alignedReturns || result.series?.[r.target]?.returns || [];
    const ref = referencePairStats(x, y);
    return calculationStamp({
      id: r.primary + '.vs.' + r.target + '.bivariate',
      formula: 'cov(X,Y), corr(X,Y), beta = cov(X,Y)/var(X), alpha = média(Y) − beta × média(X)',
      inputs: [r.primary + '.returns', r.target + '.returns'],
      observations: ref?.n ?? r.n ?? null,
      sample: { start: result.rowsStart ?? null, end: result.rowsEnd ?? null },
      assumptions: ['Associação observacional; não estabelece causalidade.', 'A direção de beta depende de qual série é X e qual é Y.'],
      checks: ref ? [
        check('correlação vs referência independente', r.correlation, ref.correlation, 1e-8),
        check('covariância vs referência independente', r.covariance, ref.covariance, 1e-8),
        check('beta vs referência independente', r.beta, ref.beta, 1e-8),
        check('alpha vs referência independente', r.alpha, ref.alpha, 1e-8),
        check('R² vs correlação² independente', r.r2, ref.r2, 1e-8),
        check('contagem de pares válidos', r.n, ref.n, 0)
      ] : []
    });
  });
  return {
    mathVersion: ANALYSIS_MATH_VERSION,
    status: 'INTERNAL_CHECKS_ONLY',
    message: 'Carimbos documentam fórmulas, amostra e pressupostos. Não substituem reprodução independente nem validação econômica.',
    sample: { observations: result.observations, start: result.rowsStart ?? null, end: result.rowsEnd ?? null },
    returnMode: result.returnMode,
    periodsPerYear: result.periods,
    temporalDesign: result.temporal ?? null,
    series: seriesAudit,
    relations: relationAudit
  };
}
