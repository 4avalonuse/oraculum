export async function loadInvestigationTimeline({ dataClient, selection }) {
  const events = selection.filter(item => item.kind === 'EVENTO');
  const variables = selection.filter(item => item.kind === 'VARIÁVEL');

  const [allEvents, ...series] = await Promise.all([
    dataClient.loadEvents(),
    ...variables.map(item => dataClient.loadSeries({ symbol: item.symbol }))
  ]);

  const selectedEventIds = new Set(events.map(item => item.id));
  return {
    events: allEvents.filter(event => selectedEventIds.has(event.id)),
    series: series.map((result, index) => ({
      catalogId: variables[index].id,
      name: variables[index].name,
      symbol: variables[index].symbol,
      observations: result.observations,
      meta: result.meta
    }))
  };
}
