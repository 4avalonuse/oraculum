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

mountHUD(document.getElementById('dev-hud-root'));

async function boot() {
  engine = new ChartEngine($('#ch'));
  drawingTools = new DrawingTools(engine);
  drawingTools.init();
  const shell = document.querySelector('.chart-shell');
  const tb = document.getElementById('drawing-toolbar');
  if (shell && tb && tb.parentElement !== shell) shell.appendChild(tb);
  themeManager.init(engine);
  setupControls(engine, tableModal);

  const datasets = await loadDatasets();
  if (!datasets.length) {
    document.getElementById('status').textContent = 'API online · sem datasets';
    return;
  }
  const id = document.getElementById('sel-dataset').value || datasets[0].id;
  document.getElementById('sel-dataset').value = id;
  await sync(engine, id, document.getElementById('sel-tf').value, 'linear', 'line');
}
boot().catch((error) => {
  console.error(error);
  document.getElementById('status').textContent = 'Falha ao iniciar';
});
