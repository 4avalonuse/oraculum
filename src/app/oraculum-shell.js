import { createDataClient } from '../data/client.js';
import { attachPersistentDataLibrary } from '../oraculum/ui/data-library-persistent.js';
import { attachInvestigationTimeline } from '../oraculum/ui/investigation-timeline.js';

const API = 'https://oraculum-data-api.4avalonuse.workers.dev';
const root = document.querySelector('#oraculum-data-library');
const selection = document.querySelector('#oraculum-selection');
const timelineRoot = document.querySelector('#oraculum-investigation-timeline') || document.querySelector('#timeline');
const status = document.querySelector('#status');
const dataClient = createDataClient(API);

const nav = document.querySelector('#oraculum-nav');
const navLinks = [...(nav?.querySelectorAll('[data-nav-target]') || [])];
const sections = navLinks
  .map(link => document.getElementById(link.dataset.navTarget))
  .filter(Boolean);

function activate(targetId, updateHash = false) {
  navLinks.forEach(link => {
    link.classList.toggle('is-active', link.dataset.navTarget === targetId);
  });
  if (updateHash) history.replaceState(null, '', '#' + targetId);
}

navLinks.forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const target = document.getElementById(link.dataset.navTarget);
    if (!target) return;
    activate(link.dataset.navTarget, true);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const observer = new IntersectionObserver(entries => {
  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) activate(visible.target.id);
}, { threshold: [0.2, 0.45, 0.7] });

sections.forEach(section => observer.observe(section));
activate(location.hash.replace('#', '') || 'visao');

let library;
const timeline = attachInvestigationTimeline({
  root: timelineRoot,
  statusRoot: status,
  dataClient,
  getSelection: () => library?.getSelection() || []
});

library = attachPersistentDataLibrary(root, (items, action = {}) => {
  if (selection) {
    selection.textContent = items.length
      ? `${items.length} item(ns) selecionado(s) · toque em INVESTIGAR`
      : 'Nenhum dado selecionado.';
  }
  if (action.investigate) {
    timeline.refresh();
    document.querySelector('#timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activate('timeline', true);
  }
});
