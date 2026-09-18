import './core/chart-plugins.js';
import { ChartEngine } from './core/chart-engine.js';
import { mountHUD } from './ui/dev-hud.js';
import { DrawingTools } from './ui/drawing-tools.js';
import { TableModal } from './ui/table-modal.js';
import { themeManager } from './ui/theme-manager.js';
import { setupControls } from './ui/controls.js';
import { loadDatasets, sync } from './core/sync.js';

const $ = (s) => document.querySelector(s);
let engine = null;
let drawingTools = null;
const tableModal = new TableModal();
const QS = new URLSearchParams(location.search);

if (QS.get('dev') === '1') {
  mountHUD(document.getElementById('dev-hud-root'));
}

function setStartupState(title, meta, status) {
  document.getElementById('dataset-name').textContent = title;
  document.getElementById('dataset-meta').textContent = meta;
  document.getElementById('status').textContent = status;
}

async function boot() {
  engine = new ChartEngine($('#ch'));
  drawingTools = new DrawingTools(engine);
  drawingTools.init();
  const shell = document.querySelector('.chart-shell');
  const tb = document.getElementById('drawing-toolbar');
  if (shell && tb && tb.parentElement !== shell) shell.appendChild(tb);
  themeManager.init(engine);
  setupControls(engine, tableModal);

  try {
    const datasets = await loadDatasets();
    if (!datasets.length) {
      setStartupState(
        'Nenhum dataset disponível',
        'A Data API respondeu sem séries. Verifique a ingestão do backend.',
        'API online · sem datasets'
      );
      return;
    }
    const id = document.getElementById('sel-dataset').value || datasets[0].id;
    document.getElementById('sel-dataset').value = id;
    await sync(engine, id, 'linear', 'line');
  } catch (error) {
    console.error(error);
    setStartupState(
      'Falha ao carregar dados',
      error.message || 'Não foi possível conectar à Data API.',
      'Erro de conexão'
    );
  }
}

boot();
