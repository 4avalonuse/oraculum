export function createInvestigationSelectionService(store, items) {
  let selected = new Set(store?.load?.() || []);

  const read = () => items.filter(item => selected.has(item.id));

  return Object.freeze({
    list: read,
    toggle(id) {
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      store?.save?.([...selected]);
      return read();
    },
    clear() {
      selected.clear();
      store?.clear?.();
      return read();
    }
  });
}
