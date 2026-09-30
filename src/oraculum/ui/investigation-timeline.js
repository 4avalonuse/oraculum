import { loadInvestigationTimeline } from '../application/investigation/timeline-loader.js';
import { renderTimelineAxis } from './timeline-axis.js';

export function attachInvestigationTimeline({
  root,
  statusRoot,
  dataClient,
  getSelection,
  getChartRange = () => null,
  onEventClick = null
}) {
  if (!root) return { refresh: async () => null, syncRange: () => {} };

  let result = null;

  function chartRange() {
    const range = getChartRange?.();
    if (!range) return null;
    const min = Number(range.min);
    const max = Number(range.max);
    return Number.isFinite(min) && Number.isFinite(max) && max > min ? { min, max } : null;
  }

  function render() {
    root.replaceChildren();

    if (!result) {
      root.innerHTML = '<div class="timeline-empty">Selecione dados no catálogo e toque em INVESTIGAR.</div>';
      return;
    }

    const range = chartRange();
    const axis = renderTimelineAxis({
      timeline: result.timeline,
      events: result.events,
      start: range?.min ?? null,
      end: range?.max ?? null,
      onEventClick
    });

    const head = document.createElement('div');
    head.className = 'timeline-dock-head';
    const label = document.createElement('strong');
    label.textContent = 'LINHA DO TEMPO';
    const count = document.createElement('span');
    const visibleEvents = range
      ? result.events.filter(event => Number(event.timestamp) >= range.min && Number(event.timestamp) <= range.max).length
      : result.events.length;
    count.textContent = visibleEvents
      ? visibleEvents + (visibleEvents === 1 ? ' evento' : ' eventos')
      : 'sem eventos nesta janela';

    head.append(label, count);
    root.append(head, axis);

    if (result.series.length) {
      const seriesLine = document.createElement('div');
      seriesLine.className = 'timeline-dock-series';
      seriesLine.textContent = result.series.map(item => item.name).join(' · ');
      root.appendChild(seriesLine);
    }
  }

  async function refresh() {
    const selection = getSelection();
    result = null;
    root.replaceChildren();

    if (!selection.length) {
      root.innerHTML = '<div class="timeline-empty">Selecione dados no catálogo e toque em INVESTIGAR.</div>';
      return null;
    }

    if (statusRoot) statusRoot.textContent = 'Carregando investigação…';

    try {
      result = await loadInvestigationTimeline({ dataClient, selection });
      render();
      if (statusRoot) statusRoot.textContent = 'Investigação carregada.';
      return result;
    } catch (error) {
      result = null;
      const message = document.createElement('div');
      message.className = 'timeline-error';
      message.textContent = error.message || 'Não foi possível carregar os dados.';
      root.appendChild(message);
      if (statusRoot) statusRoot.textContent = 'Erro ao carregar investigação.';
      return null;
    }
  }

  return Object.freeze({
    refresh,
    syncRange: render
  });
}
