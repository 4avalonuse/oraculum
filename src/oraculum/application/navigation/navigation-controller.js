import { createNavigationState } from './navigation-state.js';

export function createNavigationController({ root, routes, initialRoute, onChange = () => {} }) {
  const state = createNavigationState(initialRoute, routes);
  const links = [...(root?.querySelectorAll('[data-nav-target]') || [])];
  const sections = new Map(routes.map(id => [id, document.getElementById(id)]));

  function render(route) {
    links.forEach(link => {
      const active = link.dataset.navTarget === route;
      link.classList.toggle('is-active', active);
      link.setAttribute('aria-current', active ? 'page' : 'false');
    });

    sections.forEach((section, id) => {
      if (!section) return;
      const active = id === route;
      section.hidden = !active;
      section.classList.toggle('is-active', active);
    });

    onChange(route);
  }

  function navigate(route, { hash = true } = {}) {
    const next = state.set(route);
    render(next);
    if (hash) history.replaceState(null, '', '#' + next);
    return next;
  }

  links.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      navigate(link.dataset.navTarget);
    });
  });

  window.addEventListener('popstate', () => {
    navigate(location.hash.slice(1), { hash: false });
  });

  const fromHash = location.hash.slice(1);
  render(state.set(fromHash || initialRoute));

  return Object.freeze({
    current: () => state.get(),
    navigate
  });
}
