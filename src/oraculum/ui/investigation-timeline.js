import { loadInvestigationTimeline } from '../application/investigation/timeline-loader.js';

export function attachInvestigationTimeline({ root, statusRoot, dataClient, getSelection }) {
  if (!root) return { refresh: async () => null };

  async function refresh() {
    const selection = getSelection();
    root.replaceChildren();

    if (!selection.length) {
      root.innerHTML = '<div class="timeline-empty">Selecione eventos ou variáveis para iniciar a investigação.</div>';
      return null;
    }

    if (statusRoot) statusRoot.textContent = 'Carregando investigação…';

    try {
      const result = await loadInvestigationTimeline({ dataClient, selection });

      const title = document.createElement('h2');
      title.textContent = 'Timeline da investigação';
      root.appendChild(title);

      result.events.forEach(event => {
        const row = document.createElement('article');
        row.className = 'timeline-event';
        const date = new Date(event.timestamp).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        row.innerHTML = '<span class="timeline-date"></span><strong></strong><small></small>';
        row.querySelector('.timeline-date').textContent = date;
        row.querySelector('strong').textContent = event.title;
        row.querySelector('small').textContent = event.description || event.source || '';
        root.appendChild(row);
      });

      result.series.forEach(series => {
        const row = document.createElement('article');
        row.className = 'timeline-series';
        row.innerHTML = '<strong></strong><span></span>';
        row.querySelector('strong').textContent = series.name;
        row.querySelector('span').textContent = `${series.observations.length.toLocaleString('pt-BR')} observações · ${series.meta?.sourceName || 'fonte desconhecida'}`;
        root.appendChild(row);
      });

      if (!result.events.length && !result.series.length) {
        root.insertAdjacentHTML('beforeend', '<div class="timeline-empty">Nenhum dado encontrado para a seleção.</div>');
      }

      if (statusRoot) statusRoot.textContent = 'Investigação carregada.';
      return result;
    } catch (error) {
      if (statusRoot) statusRoot.textContent = 'Erro ao carregar investigação.';
      const message = document.createElement('div');
      message.className = 'timeline-error';
      message.textContent = error.message || 'Não foi possível carregar os dados.';
      root.appendChild(message);
      return null;
    }
  }

  return { refresh };
}
