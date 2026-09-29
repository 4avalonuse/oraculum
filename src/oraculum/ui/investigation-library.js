export function attachInvestigationLibrary({ root, items, selection, onChange = () => {}, onInvestigate = () => {} }) {
  if (!root) return null;

  function render() {
    root.replaceChildren();

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'data-library-investigate';
    action.textContent = 'INVESTIGAR SELEÇÃO';
    action.disabled = selection.list().length === 0;
    action.addEventListener('click', () => onInvestigate(selection.list()));
    root.appendChild(action);

    items.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'data-library-item';
      const active = selection.list().some(value => value.id === item.id);
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));

      const kind = document.createElement('span');
      kind.className = 'data-library-kind';
      kind.textContent = item.kind;
      const label = document.createElement('strong');
      label.textContent = item.label;
      const detail = document.createElement('span');
      detail.textContent = item.detail;

      button.append(kind, label, detail);
      button.addEventListener('click', () => {
        const next = selection.toggle(item.id);
        render();
        onChange(next);
      });
      root.appendChild(button);
    });
  }

  render();
  onChange(selection.list());

  return Object.freeze({
    refresh: render,
    clear() {
      const next = selection.clear();
      render();
      onChange(next);
    }
  });
}
