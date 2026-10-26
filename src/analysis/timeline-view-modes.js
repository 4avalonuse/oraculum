/* A single owner for independent timeline presentation controls. */
export function createTimelineViewModes() {
  let chart = 'relative';
  let alignment = 'start';
  return {
    get chart() { return chart; },
    get alignment() { return alignment; },
    toggleChart() { chart = chart === 'relative' ? 'calendar' : 'relative'; return chart; },
    toggleAlignment() { alignment = alignment === 'start' ? 'sequential' : 'start'; return alignment; }
  };
}
