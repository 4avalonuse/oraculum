import { ORACULUM_DATA_CATALOG } from '../catalog/data-catalog.js';

export function attachDataLibrary(root, onSelectionChange = () => {}) {
  if (!root) return null;
  const selected = new Set();
  const items = [
    ...ORACULUM_DATA_CATALOG.events.map(item => ({ ...item, kind: 'EVENTO', label: item.title, detail: item.date })),
    ...ORACULUM_DATA_CATALOG.variables.map(item => ({ ...item, kind: 'VARIÁVEL', label: item.name, detail: item.symbol }))
  ];

  function render() {
    root.replaceChildren();
    for (const item of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'data-library-item' + (selected.has(item.id) ? ' is-selected' : '');
      button.setAttribute('aria-pressed', String(selected.has(item.id)));
      const kind = document.createElement('span');
      kind.className = 'data-library-kind';
      kind.textContent = item.kind;
      const label = document.createElement('strong');
      label.textContent = item.label;
      const detail = document.createElement('span');
      detail.textContent = item.detail;
      button.append(kind, label, detail);
      button.addEventListener('click', () => {
        if (selected.has(item.id)) selected.delete(item.id);
        else selected.add(item.id);
        render();
        onSelectionChange(items.filter(value => selected.has(value.id)));
      });
      root.appendChild(button);
    }
  }

  render();

  return {
    getSelection() {
      return items.filter(item => selected.has(item.id));
    },
    clear() {
      selected.clear();
      render();
      onSelectionChange([]);
    }
  };
}
