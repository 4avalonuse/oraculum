import './core/chart-plugins.js';
import { ChartEngine } from './core/chart-engine.js';
import { mountHUD } from './ui/dev-hud.js';
import { DrawingTools } from './ui/drawing-tools.js';
import { TableModal } from './ui/table-modal.js';
import { themeManager } from './ui/theme-manager.js';
import { setupControls } from './ui/controls.js';
import { loadDatasets, syncSelected, setAnalysisPeriods } from './core/sync.js';
import { AnalysisPeriods } from './ui/analysis-periods.js';

const $ = (s) => document.querySelector(s);
const QS = new URLSearchParams(location.search);
let engine = null;

const tableModal = new TableModal();
const analysisPeriods = new AnalysisPeriods(document.getElementById('analysis-periods'));

if (QS.get('dev') === '1') {
  mountHUD(document.getElementById('dev-hud-root'));
}

function setStartupState(title, meta, status) {
  document.getElementById('dataset-name').textContent = title;
  document.getElementById('dataset-meta').textContent = meta;
  document.getElementById('status').textContent = status;
}

function readAvailable(select) {
  const selected = select?.selectedOptions?.[0];
  if (!selected?.dataset?.datasets) return {};
  try {
    const parsed = JSON.parse(selected.dataset.datasets);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

async function boot() {
  engine = new ChartEngine($('#ch'));
  const drawingTools = new DrawingTools(engine);
  drawingTools.init();

  const shell = document.querySelector('.chart-shell');
  const tb = document.getElementById('drawing-toolbar');
  if (shell && tb && tb.parentElement !== shell) shell.appendChild(tb);

  themeManager.init(engine);
  const controls = setupControls(engine, tableModal);
  setAnalysisPeriods(analysisPeriods, engine);

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

    controls.refreshIntervalButtons();

    const selected = document.getElementById('sel-dataset').selectedOptions[0];
    const available = readAvailable(document.getElementById('sel-dataset'));
    const requested = QS.get('dataset');
    const requestedDataset = datasets.find(d => d.id === requested);

    let interval = requestedDataset?.interval || controls.getInterval() || '1h';
    if (!available[interval]) {
      interval = Object.keys(available).find(value => ['1m', '1h', '1d', '1w', '1M'].includes(value)) || '1d';
    }

    if (!controls.setInterval(interval)) {
      controls.refreshIntervalButtons();
    }

    await syncSelected(engine, 'linear', 'line', { interval });
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
