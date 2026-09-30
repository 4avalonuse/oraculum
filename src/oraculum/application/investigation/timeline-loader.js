import { buildInvestigationTimeline } from './timeline-builder.js';

function eventTimestamp(event) {
  if (Number.isFinite(Number(event?.timestamp))) return Number(event.timestamp);
  const timestamp = Date.parse(String(event?.date || ''));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeCatalogEvent(event) {
  const timestamp = eventTimestamp(event);
  return timestamp === null ? null : { ...event, timestamp };
}

export async function loadInvestigationTimeline({ dataClient, selection }) {
  const events = selection
    .filter(item => item.kind === 'EVENTO')
    .map(normalizeCatalogEvent)
    .filter(Boolean);
  const variables = selection.filter(item => item.kind === 'VARIÁVEL');

  const [allEvents, ...series] = await Promise.all([
    dataClient.loadEvents().catch(() => []),
    ...variables.map(item => dataClient.loadSeries({ symbol: item.symbol }))
  ]);

  const apiEventsById = new Map(
    (Array.isArray(allEvents) ? allEvents : [])
      .filter(event => event?.id)
      .map(event => [event.id, event])
  );

  const selectedEvents = events.map(event => ({
    ...event,
    ...(apiEventsById.get(event.id) || {}),
    timestamp: eventTimestamp(apiEventsById.get(event.id)) ?? event.timestamp
  }));

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
