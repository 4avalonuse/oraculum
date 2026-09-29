import { createDataClient } from '../data/client.js';
import { createInvestigationStore } from '../oraculum/application/investigation/investigation-store.js';
import { createInvestigationSelectionService } from '../oraculum/application/investigation/selection-service.js';
import { getInvestigationCatalog } from '../oraculum/application/investigation/catalog-adapter.js';
import { attachInvestigationLibrary } from '../oraculum/ui/investigation-library.js';
import { attachInvestigationTimeline } from '../oraculum/ui/investigation-timeline.js';
import { createNavigationController } from '../oraculum/application/navigation/navigation-controller.js';
import { bootstrap as bootstrapOchama } from './ochama-bootstrap.js';

const API = 'https://oraculum-data-api.4avalonuse.workers.dev';
const ROUTES = ['visao', 'dados', 'timeline', 'workspace'];
const dataClient = createDataClient(API);
const status = document.querySelector('#status');
const selectionRoot = document.querySelector('#oraculum-selection');
const libraryRoot = document.querySelector('#oraculum-data-library');

const catalog = getInvestigationCatalog();
const selection = createInvestigationSelectionService(createInvestigationStore(), catalog);

let navigation = null;

const timeline = attachInvestigationTimeline({
  root: document.querySelector('#timeline'),
  statusRoot: status,
  dataClient,
  getSelection: selection.list,
  onEventClick(event) {
    navigation.navigate('visao');
    const focused = window.ochama?.focusTimestamp?.(event.timestamp);
    if (status) {
      status.textContent = focused
        ? 'Gráfico focado em ' + new Date(event.timestamp).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : 'Evento fora do período disponível no gráfico.';
    }
  }
});

navigation = createNavigationController({
  root: document.querySelector('#oraculum-nav'),
  routes: ROUTES,
  initialRoute: 'visao',
  onChange(route) {
    if (route === 'timeline' && selection.list().length) timeline.refresh();
  }
});

attachInvestigationLibrary({
  root: libraryRoot,
  items: catalog,
  selection,
  onChange(items) {
    if (selectionRoot) {
      selectionRoot.textContent = items.length
        ? `${items.length} item(ns) selecionado(s)`
        : 'Nenhum dado selecionado.';
    }
  },
  onInvestigate() {
    navigation.navigate('timeline');
  }
});

window.oraculum = Object.freeze({
  navigation,
  selection,
  refreshInvestigation: () => timeline.refresh()
});

function showStartupError(error) {
  console.error('[Oraculum]', error);
  const chart = document.querySelector('#chart');
  chart?.classList.remove('is-loading');
  chart?.classList.add('is-error');
  if (!status) return;
  status.textContent = 'Erro: ' + (error?.message || 'falha desconhecida');
  status.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;width:auto;height:auto;overflow:visible;clip:auto;clip-path:none;z-index:5000;padding:8px 10px;border:1px solid #7f1d1d;border-radius:8px;background:#1a0f12;color:#fecaca;font-size:11px;white-space:normal;';
}

bootstrapOchama().catch(showStartupError);
