/* ORACULUM — formatação e composição de métricas da interface.
 * Sem acesso a dados, DOM ou estado da investigação.
 */
export function fmt(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(value);
}

export function pct(value, decimals = 2) {
  return Number.isFinite(value) ? fmt(value * 100, decimals) + '%' : '—';
}

export function date(value) {
  return Number.isFinite(Number(value))
    ? new Date(Number(value)).toLocaleDateString('pt-BR')
    : '—';
}

export function metric(label, value, note = '', help = '') {
  const safeLabel = String(label).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const safeNote = String(note).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  return '<div class="analysis-metric"><div class="metric-label"><span>' + safeLabel + '</span><button class="metric-help" type="button" data-topic="' + safeLabel + '" aria-label="Explicar ' + safeLabel + '">?</button></div><strong>' + value + '</strong>' + (note ? '<small>' + safeNote + '</small>' : '') + '</div>';
}

export function statBlock(title, items) {
  const safeTitle = String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  return '<section class="analysis-stat-block"><h3>' + safeTitle + '</h3><div class="results-grid">' + items.join('') + '</div></section>';
}
