/* Pure visual layout; never changes the source timestamps or windows. */
export function timelineLayout(slots, rowsForSlot, alignment) {
  const durations = slots.map(slot => rowsForSlot(slot).length);
  const capacity = Math.max(1, ...durations);
  let offset = 0;
  return slots.map((slot, index) => {
    const rows = rowsForSlot(slot);
    const position = alignment === 'sequential' ? offset : 0;
    if (alignment === 'sequential') offset += durations[index];
    const visibleCount = Math.max(0, Math.min(rows.length, capacity - position));
    return {
      position, duration: rows.length, capacity, visibleCount, hiddenCount: rows.length-visibleCount,
      rows: rows.slice(0, visibleCount), incomplete: visibleCount < rows.length
    };
  });
}
