/* Coordinates and normalization belong to the plot, never the timeline state. */
export function plotCoordinates(plotted, layouts, mode, sharedRows, nearestIndex) {
  const calendar = mode === 'calendar';
  const calendarRows = calendar ? sharedRows() : [];
  const firstSlot = plotted[0];
  const anchor = firstSlot?.rows?.[0];
  const firstAsset = firstSlot?.slot?.assetKey;
  const capacity = calendar ? Math.max(1,calendarRows.length-1) : Math.max(1,layouts[0]?.capacity||1);
  return {
    capacity,
    curves: plotted.map(({slot,rows,reference}) => {
      const position = calendar
        ? Math.max(0,nearestIndex(calendarRows,rows[0]?.timestamp))
        : layouts[slot.slotIndex]?.position||0;
      const firstPrice = Number(rows[0]?.[slot.key]);
      const sharedPrice = slot.assetKey === firstAsset ? Number(anchor?.[firstSlot.slot.key]) : NaN;
      // Only use a common-date anchor if that asset has a valid quote there.
      const base = calendar && sharedPrice > 0 ? sharedPrice : firstPrice;
      return {slot,rows,reference,position,values:rows.map(r=>100*Number(r[slot.key])/base)};
    }).filter(curve=>curve.values.every(v=>Number.isFinite(v)&&v>0))
  };
}
