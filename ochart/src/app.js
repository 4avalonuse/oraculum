// src/app.js  v.1.3 (fix imports -> hub)
// ============================================================
// Ponto de entrada do OChart 
// - Inicializa engine, HUD, tema, ferramentas de desenho
// - Faz bind dos controles e dispara a primeira sync
// - Conecta o Chart ao Oraculum Hub via ChartAdapter
// ============================================================

import './core/chart-plugins.js'; // registra zoom/annotation/financial no Chart global

import { ChartEngine } from './core/chart-engine.js';
import { mountHUD } from './ui/dev-hud.js';
import { DrawingTools } from './ui/drawing-tools.js';
import { TableModal } from './ui/table-modal.js';
import { themeManager } from './ui/theme-manager.js';
import { setupControls } from './ui/controls.js';
import { sync } from './core/sync.js';

// 🔗 Hub (corrigido: caminho relativo para /oraculum/hub)
import { ChartAdapter } from '../../hub/chart-adapter.js';

// Atalho para seletores
const $ = (sel) => document.querySelector(sel);

let engine = null;
let drawingTools = null;
const tableModal = new TableModal();
let chartAdapter = null;

// HUD
mountHUD(document.getElementById('dev-hud-root'));

function boot() {
  // 1) Engine principal
  engine = new ChartEngine($('#ch'), { bundlesEndpoint: './api/bundles.php' });

  // 2) Ferramentas de desenho
  drawingTools = new DrawingTools(engine);
  drawingTools.init();
  const shell = document.querySelector('.chart-shell');
  const tb = document.getElementById('drawing-toolbar');
  if (shell && tb && tb.parentElement !== shell) shell.appendChild(tb);

  // 3) Tema
  themeManager.init(engine);

  // 4) Controles (binds de UI)
  setupControls(engine, tableModal);

  // 5) Hub ⇄ Chart
  chartAdapter = new ChartAdapter().wire(engine);
  // window.oraculumChartAdapter = chartAdapter; // opcional debug

  // 6) Primeira sync (default: 1d, log, line)
  sync(engine, '1d', 'logarithmic', 'line');
}

// Boot
boot();
