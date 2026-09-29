import { createTimeline } from '../../domain/index.js';

function timestampsFromSeries(series) {
  return series.flatMap(item => item.observations.map(observation => Number(observation.timestamp)));
}

export function buildInvestigationTimeline({ events = [], series = [] }) {
  const timestamps = [
    ...events.map(event => Number(event.timestamp)),
    ...timestampsFromSeries(series)
  ].filter(Number.isFinite).sort((a, b) => a - b);

  return createTimeline({
    id: 'investigation',
    title: 'Timeline da investigação',
    start: timestamps[0] ?? null,
    end: timestamps[timestamps.length - 1] ?? null,
    items: timestamps.map(timestamp => ({ timestamp }))
  });
}
