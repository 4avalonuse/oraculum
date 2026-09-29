import { buildInvestigationTimeline } from './timeline-builder.js';

export async function loadInvestigationTimeline({ dataClient, selection }) {
  const events = selection.filter(item => item.kind === 'EVENTO');
  const variables = selection.filter(item => item.kind === 'VARIÁVEL');

  const [allEvents, ...series] = await Promise.all([
    dataClient.loadEvents(),
    ...variables.map(item => dataClient.loadSeries({ symbol: item.symbol }))
  ]);

  const selectedEventIds = new Set(events.map(item => item.id));
  const selectedEvents = allEvents.filter(event => selectedEventIds.has(event.id));
  const selectedSeries = series.map((result, index) => ({
      catalogId: variables[index].id,
      name: variables[index].name,
      symbol: variables[index].symbol,
      observations: result.observations,
      meta: result.meta
    }));

  return {
    events: selectedEvents,
    series: selectedSeries,
    timeline: buildInvestigationTimeline({ events: selectedEvents, series: selectedSeries })
  };
}
