function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

export function renderTimelineAxis({ timeline, events = [] }) {
  const axis = document.createElement('div');
  axis.className = 'timeline-axis';
  if (timeline.start === null || timeline.end === null) return axis;
  const start = timeline.start;
  const end = timeline.end;
  const span = Math.max(end - start, 1);
  const points = [0, 0.25, 0.5, 0.75, 1];
  axis.innerHTML = '<div class="timeline-axis-line"></div>';
  points.forEach((ratio) => {
    const tick = document.createElement('span');
    tick.className = 'timeline-axis-tick';
    tick.style.left = (ratio * 100) + '%';
    tick.textContent = formatDate(start + span * ratio);
    axis.appendChild(tick);
  });
  events.forEach((event) => {
    const timestamp = Number(event.timestamp);
    if (!Number.isFinite(timestamp)) return;
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'timeline-axis-event';
    marker.style.left = Math.max(0, Math.min(100, ((timestamp - start) / span) * 100)) + '%';
    marker.title = event.title || 'Evento';
    marker.setAttribute('aria-label', event.title || 'Evento');
    axis.appendChild(marker);
  });
  return axis;
}