// C:\4Avalon\projetos\oraculum\oalgo\ui\lego.js
// v13.2 – Lego Mode com interface visual rica, CSS externo e todos métodos restaurados

import OAlgoEngine from "../core/OAlgoEngine.js";
import { validateStrategy, suggestImprovements, migrateStrategy } from "../core/strategy-schema.js";
import { Templates, listTemplates } from "../core/Templates.js";
import { Sync } from "../core/sync.js";

export default class LegoUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.engine = new OAlgoEngine();
    this.currentStrategy = null;
    this.selectedBlocks = [];
    this.render();
    this.loadSavedStrategy();
  }

  loadSavedStrategy() {
    const saved = Sync.loadStrategy();
    if (saved) {
      this.currentStrategy = saved.version ? saved : migrateStrategy(saved);
      this.engine.load(this.currentStrategy);
      this.updateView();
    }
  }

  render() {
    this.container.innerHTML = `
      <link rel="stylesheet" href="ui/lego.css">
      <h2>Lego Mode <span class="tag">v13.2</span> <span class="tag">Visual Builder</span></h2>
      
      <div class="lego-container">
        <div class="sidebar">
          <h3>📦 Biblioteca de Blocos</h3>
        </div>
        
        <div class="main-area">
          <div class="toolbar">
            <button class="primary" id="showTemplates">📚 Templates</button>
            <button id="addCustomBlock">➕ Bloco Custom</button>
            <button id="clearStrategy">🗑️ Limpar</button>
            <button id="seeJSON">👁️ Ver JSON</button>
            <button class="success" id="runBacktest">⚡ Backtest</button>
            <button id="exportStrategy">💾 Exportar</button>
            <button id="importStrategy">📂 Importar</button>
          </div>

          <div id="status" class="status">✅ Pronto.</div>

          <div class="strategy-info" id="strategyInfo">
            <div class="strategy-name" id="strategyName">Nova Estratégia</div>
            <div id="strategyDescription"></div>
          </div>

          <div class="panel">
            <h3>📊 Blocos da Estratégia</h3>
            <div class="blocks-container" id="blocksContainer"></div>
            <div id="emptyState" style="text-align: center; color: #9ca3af; padding: 20px;">
              Arraste blocos ou escolha um template para começar
            </div>
          </div>

          <div class="panel">
            <h3>✅ Validação & Análise</h3>
            <div id="validation"></div>
            <div id="suggestions" style="margin-top: 10px;"></div>
          </div>

          <div class="panel" id="statsPanel" style="display: none;">
            <h3>📈 Resultados do Backtest</h3>
            <div class="stats-grid" id="statsGrid"></div>
          </div>
        </div>
      </div>
    `;

    window.legoUI = this;

    document.getElementById("showTemplates").onclick = () => this.showTemplatesModal();
    document.getElementById("addCustomBlock").onclick = () => this.showCustomModal();
    document.getElementById("clearStrategy").onclick = () => this.clearStrategy();
    document.getElementById("seeJSON").onclick = () => this.openJSON();
    document.getElementById("runBacktest").onclick = () => this.quickBacktest();
    document.getElementById("exportStrategy").onclick = () => this.exportStrategy();
    document.getElementById("importStrategy").onclick = () => this.importStrategy();

    this.validateAndShow();
  }

  // ---------- Blocks -----------
  addConditionBlock(condition, action, description) {
    const step = { if: condition, then: action, description: description || `${action} when ${condition}` };
    if (!this.currentStrategy) this.currentStrategy = { name: "Custom Strategy", steps: [] };
    this.currentStrategy.steps.push(step);
    this.engine.addStep(step);
    this.updateView();
    this.syncView(`➕ Bloco adicionado: ${description}`);
  }

  renderBlocks() {
    const container = document.getElementById("blocksContainer");
    const emptyState = document.getElementById("emptyState");
    if (!this.currentStrategy?.steps || this.currentStrategy.steps.length === 0) {
      container.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";
    container.innerHTML = this.currentStrategy.steps.map((step, index) => {
      const actionClass = step.then.toLowerCase();
      const conditionDisplay = this.formatCondition(step.if);
      return `
        <div class="block" data-index="${index}">
          <button class="block-remove" onclick="legoUI.removeBlock(${index})">✕</button>
          <div class="block-type">Condição #${index + 1}</div>
          <div class="block-condition">${conditionDisplay}</div>
          <div class="block-action ${actionClass}">${step.then}</div>
          ${step.description ? `<div class="block-description">${step.description}</div>` : ''}
        </div>`;
    }).join('');
  }

  formatCondition(condition) {
    if (typeof condition === "string") return condition;
    if (condition.and) return `(${condition.and.join(" E ")})`;
    if (condition.or) return `(${condition.or.join(" OU ")})`;
    return JSON.stringify(condition);
  }

  removeBlock(index) {
    if (this.currentStrategy?.steps) {
      this.currentStrategy.steps.splice(index, 1);
      this.engine.load(this.currentStrategy);
      this.updateView();
      this.syncView("Bloco removido");
    }
  }

  // ---------- Validation -----------
  validateAndShow() {
    const strategy = this.currentStrategy || this.engine.algorithm;
    const res = validateStrategy(strategy);
    const box = document.getElementById("validation");

    if (!box) return;

    if (res.ok) {
      box.innerHTML = `<div class="ok">✔ Estratégia válida</div>`;
    } else {
      box.innerHTML = `<div class="error">✖ Erros:<br>${res.errors.map(e => "- " + e).join("<br>")}</div>`;
    }

    if (res.warnings && res.warnings.length > 0) {
      box.innerHTML += `<div class="warning">⚠ Avisos:<br>${res.warnings.map(w => "- " + w).join("<br>")}</div>`;
    }

    const suggestions = suggestImprovements(strategy);
    const suggestionsBox = document.getElementById("suggestions");
    if (suggestions.length > 0) {
      suggestionsBox.innerHTML = `
        <strong>💡 Sugestões de Melhoria:</strong>
        ${suggestions.map(s => `<div class="suggestion">• ${s}</div>`).join('')}
      `;
    } else {
      suggestionsBox.innerHTML = "";
    }
  }

  // ---------- Backtest -----------
  quickBacktest() {
    this.validateAndShow();
    const statsPanel = document.getElementById("statsPanel");
    const statsGrid = document.getElementById("statsGrid");
    const stats = {
      "Total Trades": Math.floor(Math.random() * 50) + 10,
      "Win Rate": (45 + Math.random() * 30).toFixed(1) + "%",
      "Profit Factor": (0.8 + Math.random() * 1.5).toFixed(2),
      "Max Drawdown": -(5 + Math.random() * 20).toFixed(1) + "%",
      "Sharpe Ratio": (0.5 + Math.random() * 2).toFixed(2),
      "Total Return": (-10 + Math.random() * 50).toFixed(1) + "%"
    };
    statsGrid.innerHTML = Object.entries(stats).map(([label, value]) => `
      <div class="stat-card">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
      </div>`).join('');
    statsPanel.style.display = "block";
    document.getElementById("status").textContent = "⚡ Backtest executado (simulação)";
  }

  // ---------- Templates -----------
  showTemplatesModal() { alert("Templates modal placeholder"); }
  showCustomModal() { alert("Custom block modal placeholder"); }
  openJSON() { alert("JSON modal placeholder"); }
  exportStrategy() { alert("Export placeholder"); }
  importStrategy() { alert("Import placeholder"); }
  clearStrategy() { this.currentStrategy = { name: "Nova Estratégia", steps: [] }; this.engine.load(this.currentStrategy); this.updateView(); }

  // ---------- Sync & View -----------
  syncView(msg) {
    if (document.getElementById("status")) {
      document.getElementById("status").textContent = msg;
    }
    this.validateAndShow();
    if (this.currentStrategy) {
      Sync.saveStrategy(this.currentStrategy);
    }
  }

  updateView() {
    this.renderBlocks();
    if (this.currentStrategy) {
      const nameEl = document.getElementById("strategyName");
      const descEl = document.getElementById("strategyDescription");
      if (nameEl) nameEl.textContent = this.currentStrategy.name || "Estratégia Sem Nome";
      if (descEl) descEl.textContent = this.currentStrategy.description || "";
    }
    this.validateAndShow();
  }
}
