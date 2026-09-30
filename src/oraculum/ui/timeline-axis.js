function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

export function renderTimelineAxis({ timeline, events = [], start = null, end = null, onEventClick = null }) {
  const axis = document.createElement('div');
  axis.className = 'timeline-axis';

  const axisStart = Number.isFinite(Number(start)) ? Number(start) : timeline.start;
  const axisEnd = Number.isFinite(Number(end)) ? Number(end) : timeline.end;
  if (axisStart === null || axisEnd === null || !Number.isFinite(axisStart) || !Number.isFinite(axisEnd) || axisEnd <= axisStart) {
    return axis;
  }

  const span = Math.max(axisEnd - axisStart, 1);
  const points = [0, 0.25, 0.5, 0.75, 1];
  axis.innerHTML = '<div class="timeline-axis-line"></div>';

  points.forEach((ratio) => {
    const tick = document.createElement('span');
    tick.className = 'timeline-axis-tick';
    tick.style.left = (ratio * 100) + '%';
    tick.textContent = formatDate(axisStart + span * ratio);
    axis.appendChild(tick);
  });

  events.forEach((event) => {
    const timestamp = Number(event.timestamp);
    if (!Number.isFinite(timestamp) || timestamp < axisStart || timestamp > axisEnd) return;

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'timeline-axis-event';
    marker.style.left = Math.max(0, Math.min(100, ((timestamp - axisStart) / span) * 100)) + '%';
    marker.title = event.title || 'Evento';
    marker.setAttribute('aria-label', event.title || 'Evento');
    marker.addEventListener('click', () => onEventClick?.(event));
    axis.appendChild(marker);
  });

  return axis;
}
