import { createDataClient } from '../data/client.js';
import { attachPersistentDataLibrary } from '../oraculum/ui/data-library-persistent.js';
import { attachInvestigationTimeline } from '../oraculum/ui/investigation-timeline.js';

const API = 'https://oraculum-data-api.4avalonuse.workers.dev';
const root = document.querySelector('#oraculum-data-library');
const selection = document.querySelector('#oraculum-selection');
const timelineRoot = document.querySelector('#oraculum-investigation-timeline');
const status = document.querySelector('#status');
const dataClient = createDataClient(API);

let library;
const timeline = attachInvestigationTimeline({
  root: timelineRoot,
  statusRoot: status,
  dataClient,
  getSelection: () => library?.getSelection() || []
});

library = attachPersistentDataLibrary(root, items => {
  if (selection) {
    selection.textContent = items.length
      ? `${items.length} item(ns) selecionado(s) · carregue a investigação abaixo`
      : 'Nenhum dado selecionado. Escolha o que deseja investigar.';
  }
  timeline.refresh();
});
