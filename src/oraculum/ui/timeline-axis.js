import { timestampToPlotRatio } from '../../chart/plot-geometry.js';

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

export function renderTimelineAxis({ timeline, events = [], start = null, end = null, plot = null, onEventClick = null }) {
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

  if (plot && Number.isFinite(plot.left) && Number.isFinite(plot.right)) {
    axis.style.marginLeft = plot.left + 'px';
    axis.style.marginRight = plot.right + 'px';
  }

  points.forEach((ratio) => {
    const tick = document.createElement('span');
    tick.className = 'timeline-axis-tick';
    tick.style.left = (ratio * 100) + '%';
    tick.textContent = formatDate(axisStart + span * ratio);
    axis.appendChild(tick);
  });

  events.forEach((event) => {
    const ratio = timestampToPlotRatio(event?.timestamp, axisStart, axisEnd);
    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) return;

    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'timeline-axis-event';
    marker.style.left = (ratio * 100) + '%';
    marker.title = event.title || 'Evento';
    marker.setAttribute('aria-label', event.title || 'Evento');
    marker.addEventListener('click', () => onEventClick?.(event));
    axis.appendChild(marker);
  });

  return axis;
}
