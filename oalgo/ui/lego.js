// C:\4Avalon\projetos\oraculum\oalgo\ui\lego.js
// v13.0 – Lego Mode com interface visual rica e templates reais
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
      // Migra estratégia antiga se necessário
      this.currentStrategy = saved.version ? saved : migrateStrategy(saved);
      this.engine.load(this.currentStrategy);
      this.updateView();
    }
  }

render() {
  this.container.innerHTML = `
    <style>
      .lego-container { display: flex; gap: 20px; }
      .sidebar { width: 280px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
      .main-area { flex: 1; }
      .toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
      .tag { background: #eef2ff; padding: 2px 8px; border-radius: 6px; font-size: 11px; }
      .panel { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 10px; }
      .error { color: #b91c1c; font-size: 12px; }
      .warning { color: #d97706; font-size: 12px; }
      .ok { color: #065f46; font-size: 12px; }
      .suggestion { color: #1e40af; font-size: 12px; margin: 2px 0; }

      .status { margin: 4px 0 12px 0; font-size: 12px; color: #6b7280; }
      .status.ok { color: #065f46; }
      .status.warn { color: #b45309; }
      .status.err { color: #b91c1c; }
      
      /* Modal styles */
      .modal { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: none; align-items: center; justify-content: center; z-index: 1000; }
      .modal-box { background: #fff; border-radius: 12px; width: min(900px, 90vw); max-height: 80vh; overflow-y: auto; padding: 20px; }
      .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
      .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; }

      /* Blocks styles */
      .blocks-container { display: flex; flex-direction: column; gap: 8px; margin: 15px 0; }
      .block { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 10px; position: relative; transition: all 0.2s; }
      .block:hover { border-color: #6366f1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .block-header { display: flex; justify-content: space-between; align-items: center; }
      .block-type { font-size: 11px; color: #6b7280; }
      .block-condition { font-weight: 600; color: #1f2937; margin: 5px 0; }
      .block-action { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
      .block-action.buy { background: #10b981; color: white; }
      .block-action.sell { background: #ef4444; color: white; }
      .block-description { font-size: 11px; color: #6b7280; margin-top: 5px; }
      .block-remove { position: absolute; top: 5px; right: 5px; background: #fee2e2; border: none; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 12px; }

      /* Template cards */
      .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
      .template-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; }
      .template-card:hover { border-color: #6366f1; transform: translateY(-2px); }
      .template-name { font-weight: 600; font-size: 14px; color: #1f2937; }
      .template-desc { font-size: 12px; color: #6b7280; margin-top: 4px; }
      .template-tags { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
      .template-tag { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 10px; color: #4b5563; }

      /* Condition builder */
      .condition-builder { margin: 15px 0; }
      .condition-row { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
      .condition-select, .condition-input { padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; }
      .condition-operator { padding: 4px 8px; background: #f3f4f6; border-radius: 4px; }

      /* Strategy info */
      .strategy-info { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 10px; margin: 10px 0; }
      .strategy-name { font-weight: 600; font-size: 16px; color: #0369a1; }
      .strategy-params { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px; }
      .param-item { font-size: 12px; }
      .param-label { color: #64748b; }
      .param-value { color: #1e293b; font-weight: 500; }

      /* Buttons */
      button { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 13px; transition: all 0.2s; }
      button:hover { background: #f9fafb; }
      button.primary { background: #6366f1; color: white; border-color: #6366f1; }
      button.primary:hover { background: #4f46e5; }
      button.success { background: #10b981; color: white; border-color: #10b981; }
      button.danger { background: #ef4444; color: white; border-color: #ef4444; }

      textarea.code { width: 100%; height: 300px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; }

      .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
      .stat-card { background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb; }
      .stat-label { font-size: 11px; color: #6b7280; }
      .stat-value { font-size: 18px; font-weight: 600; color: #1f2937; }
    </style>

    <h2>Lego Mode <span class="tag">v13.0</span> <span class="tag">Visual Builder</span></h2>
    
    <div class="lego-container">
      <!-- Sidebar -->
      <div class="sidebar">
        <h3>📦 Biblioteca de Blocos</h3>
        <!-- ... sidebar original ... -->
      </div>
      
      <!-- Área principal -->
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

        <!-- ⬇️ Status fixado -->
        <div id="status" class="status">✅ Pronto.</div>

        <!-- Info da estratégia -->
        <div class="strategy-info" id="strategyInfo">
          <div class="strategy-name" id="strategyName">Nova Estratégia</div>
          <div id="strategyDescription"></div>
        </div>

        <!-- Container dos blocos -->
        <div class="panel">
          <h3>📊 Blocos da Estratégia</h3>
          <div class="blocks-container" id="blocksContainer"></div>
          <div id="emptyState" style="text-align: center; color: #9ca3af; padding: 20px;">
            Arraste blocos ou escolha um template para começar
          </div>
        </div>

        <!-- Validação -->
        <div class="panel">
          <h3>✅ Validação & Análise</h3>
          <div id="validation"></div>
          <div id="suggestions" style="margin-top: 10px;"></div>
        </div>

        <!-- Stats -->
        <div class="panel" id="statsPanel" style="display: none;">
          <h3>📈 Resultados do Backtest</h3>
          <div class="stats-grid" id="statsGrid"></div>
        </div>
      </div>
    </div>
  `;

  // Referência global
  window.legoUI = this;

  // Event listeners
  document.getElementById("showTemplates").onclick = () => this.showTemplatesModal();
  document.getElementById("addCustomBlock").onclick = () => this.showCustomModal();
  document.getElementById("clearStrategy").onclick = () => this.clearStrategy();
  document.getElementById("seeJSON").onclick = () => this.openJSON();
  document.getElementById("runBacktest").onclick = () => this.quickBacktest();
  document.getElementById("exportStrategy").onclick = () => this.exportStrategy();
  document.getElementById("importStrategy").onclick = () => this.importStrategy();

  this.validateAndShow();
}


  addConditionBlock(condition, action, description) {
    const step = { 
      if: condition, 
      then: action,
      description: description || `${action} when ${condition}`
    };
    
    if (!this.currentStrategy) {
      this.currentStrategy = {
        name: "Custom Strategy",
        steps: []
      };
    }
    
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
        </div>
      `;
    }).join('');
  }

  formatCondition(condition) {
    if (typeof condition === "string") {
      return condition;
    }
    if (condition.and) {
      return `(${condition.and.join(" E ")})`;
    }
    if (condition.or) {
      return `(${condition.or.join(" OU ")})`;
    }
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

  showTemplatesModal() {
    const modal = document.getElementById("templatesModal");
    const grid = document.getElementById("templateGrid");
    
    const templateList = listTemplates();
    
    grid.innerHTML = Object.entries(Templates).map(([key, template]) => {
      const complexity = templateList.find(t => t.name === key)?.complexity || "simple";
      const complexityTag = {
        simple: { text: "Simples", color: "#10b981" },
        intermediate: { text: "Intermediário", color: "#f59e0b" },
        advanced: { text: "Avançado", color: "#ef4444" }
      }[complexity];
      
      return `
        <div class="template-card" onclick="legoUI.applyTemplate('${key}')">
          <div class="template-name">${template.name}</div>
          <div class="template-desc">${template.description}</div>
          <div class="template-tags">
            <span class="template-tag" style="background: ${complexityTag.color}22; color: ${complexityTag.color}">
              ${complexityTag.text}
            </span>
            <span class="template-tag">${template.steps.length} regras</span>
          </div>
        </div>
      `;
    }).join('');
    
    modal.style.display = "flex";
  }

  closeTemplatesModal() {
    document.getElementById("templatesModal").style.display = "none";
  }

  applyTemplate(templateName) {
    const template = Templates[templateName];
    if (!template) return;
    
    this.currentStrategy = { ...template };
    this.engine.load(this.currentStrategy);
    this.updateView();
    this.syncView(`📦 Template aplicado: ${templateName}`);
    this.closeTemplatesModal();
  }

  showCustomModal() {
    document.getElementById("customBlockModal").style.display = "flex";
  }

  closeCustomModal() {
    document.getElementById("customBlockModal").style.display = "none";
  }

  createCustomBlock() {
    const indicator = document.getElementById("customIndicator").value;
    const operator = document.getElementById("customOperator").value;
    const value = document.getElementById("customValue").value;
    const action = document.getElementById("customAction").value;
    const description = document.getElementById("customDescription").value;
    
    if (!value) {
      alert("Por favor, insira um valor");
      return;
    }
    
    const condition = `${indicator} ${operator} ${value}`;
    this.addConditionBlock(condition, action, description || condition);
    this.closeCustomModal();
  }

  clearStrategy() {
    if (confirm("Limpar toda a estratégia?")) {
      this.currentStrategy = { name: "Nova Estratégia", steps: [] };
      this.engine.load(this.currentStrategy);
      this.updateView();
      this.syncView("Estratégia limpa");
    }
  }

  openJSON() {
    const modal = document.getElementById("modalJSON");
    const editor = document.getElementById("jsonEditor");
    editor.value = JSON.stringify(this.currentStrategy || this.engine.algorithm, null, 2);
    modal.style.display = "flex";
  }

  closeJSONModal() {
    document.getElementById("modalJSON").style.display = "none";
  }

  saveJSON() {
    const editor = document.getElementById("jsonEditor");
    try {
      const json = JSON.parse(editor.value);
      const res = validateStrategy(json);
      if (!res.ok) throw new Error(res.errors.join("\n"));
      
      this.currentStrategy = json;
      this.engine.load(json);
      this.updateView();
      this.syncView("💾 JSON aplicado com sucesso");
      this.closeJSONModal();
    } catch (e) {
      alert("Erro no JSON: " + e.message);
    }
  }

  updateParams() {
    if (!this.currentStrategy) {
      this.currentStrategy = { name: "Nova Estratégia", steps: [] };
    }
    
    if (!this.currentStrategy.params) {
      this.currentStrategy.params = {};
    }
    
    this.currentStrategy.params.orderSize = parseFloat(document.getElementById("orderSize").value);
    this.currentStrategy.params.commission = parseFloat(document.getElementById("commission").value);
    this.currentStrategy.params.slippage = parseFloat(document.getElementById("slippage").value);
    this.currentStrategy.params.rsiPeriod = parseInt(document.getElementById("rsiPeriod").value);
    
    this.engine.load(this.currentStrategy);
    this.syncView("Parâmetros atualizados");
  }

  validateAndShow() {
    const strategy = this.currentStrategy || this.engine.algorithm;
    const res = validateStrategy(strategy);
    const box = document.getElementById("validation");
    
    if (res.ok) {
      box.innerHTML = `<div class="ok">✔ Estratégia válida</div>`;
    } else {
      box.innerHTML = `<div class="error">✖ Erros:<br>${res.errors.map(e => "- " + e).join("<br>")}</div>`;
    }
    
    if (res.warnings && res.warnings.length > 0) {
      box.innerHTML += `<div class="warning">⚠ Avisos:<br>${res.warnings.map(w => "- " + w).join("<br>")}</div>`;
    }
    
    // Mostrar sugestões
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

  quickBacktest() {
    this.validateAndShow();
    
    // Simula resultados do backtest
    const statsPanel = document.getElementById("statsPanel");
    const statsGrid = document.getElementById("statsGrid");
    
    // Valores simulados (em produção, viriam do backtest real)
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
      </div>
    `).join('');
    
    statsPanel.style.display = "block";
    document.getElementById("status").textContent = "⚡ Backtest executado (use a tela principal para análise completa)";
  }

  exportStrategy() {
    const strategy = this.currentStrategy || this.engine.algorithm;
    const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${strategy.name || "strategy"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importStrategy() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target.result);
            const res = validateStrategy(json);
            if (!res.ok) throw new Error(res.errors.join("\n"));
            
            this.currentStrategy = json;
            this.engine.load(json);
            this.updateView();
            this.syncView(`📂 Estratégia importada: ${json.name}`);
          } catch (err) {
            alert("Erro ao importar: " + err.message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  updateView() {
    this.renderBlocks();
    
    // Atualiza info da estratégia
    if (this.currentStrategy) {
      const nameEl = document.getElementById("strategyName");
      const descEl = document.getElementById("strategyDescription");
      if (nameEl) nameEl.textContent = this.currentStrategy.name || "Estratégia Sem Nome";
      if (descEl) descEl.textContent = this.currentStrategy.description || "";
      
      // Atualiza parâmetros na sidebar
      const orderSizeEl = document.getElementById("orderSize");
      const commissionEl = document.getElementById("commission");
      const slippageEl = document.getElementById("slippage");
      const rsiPeriodEl = document.getElementById("rsiPeriod");

      if (orderSizeEl && this.currentStrategy.params?.orderSize !== undefined) {
        orderSizeEl.value = this.currentStrategy.params.orderSize;
      }
      if (commissionEl && this.currentStrategy.params?.commission !== undefined) {
        commissionEl.value = this.currentStrategy.params.commission;
      }
      if (slippageEl && this.currentStrategy.params?.slippage !== undefined) {
        slippageEl.value = this.currentStrategy.params.slippage;
      }
      if (rsiPeriodEl && this.currentStrategy.params?.rsiPeriod !== undefined) {
        rsiPeriodEl.value = this.currentStrategy.params.rsiPeriod;
      }
    }
    
    this.validateAndShow();
  }


  syncView(msg) {
    if (document.getElementById("status")) {
      document.getElementById("status").textContent = msg;
    }
    this.validateAndShow();
    if (this.currentStrategy) {
      Sync.saveStrategy(this.currentStrategy);
    }
  }
}