// C:\4Avalon\projetos\oraculum\oalgo\ui\lego.js
// v12.4 — Lego com: ver JSON, quick backtest, templates, validação
import OAlgoEngine from "../core/OAlgoEngine.js";
import { validateStrategy, makeDefaultStrategy } from "../core/strategy-schema.js";
import { Templates } from "../core/Templates.js";
import { Sync } from "../core/sync.js";

export default class LegoUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.engine = new OAlgoEngine();
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <style>
        .toolbar { display:flex; gap:8px; flex-wrap:wrap; }
        .tag { background:#eef2ff; padding:2px 6px; border-radius:6px; font-size:12px; }
        .panel { background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin-top:10px; }
        .error { color:#b91c1c; font-size:12px; }
        .ok { color:#065f46; font-size:12px; }
        .modal { position:fixed; inset:0; background:rgba(0,0,0,.4); display:none; align-items:center; justify-content:center; }
        .modal-box { background:#fff; border-radius:10px; width:min(800px,90vw); padding:12px; }
        textarea.code { width:100%; height:300px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; }
        select, button { padding:8px 10px; }
      </style>

      <h2>Lego Mode <span class="tag">v12.4</span></h2>
      <div class="toolbar">
        <button id="addStep">➕ Add Step</button>
        <button id="seeJSON">👁️ Ver JSON</button>
        <button id="runQuick">⚡ Quick Backtest</button>
        <select id="tpl">
          <option value="">📦 Template…</option>
          <option value="SMA20 Crossover">SMA20 Crossover</option>
          <option value="Price Bands">Price Bands</option>
        </select>
        <button id="applyTpl">Aplicar Template</button>
      </div>

      <div class="panel">
        <div><strong>Status:</strong> <span id="status">Pronto.</span></div>
        <div id="validation"></div>
        <pre id="algoView" style="margin-top:8px;">${this.engine.getJSON()}</pre>
      </div>

      <div class="modal" id="modalJSON">
        <div class="modal-box">
          <h3>Estratégia (JSON)</h3>
          <textarea class="code" id="jsonEditor"></textarea>
          <div style="display:flex; gap:8px; margin-top:8px; justify-content:flex-end;">
            <button id="cancelJSON">Cancelar</button>
            <button id="saveJSON">Salvar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("addStep").onclick = () => this.addStep();
    document.getElementById("seeJSON").onclick = () => this.openJSON();
    document.getElementById("runQuick").onclick = () => this.quickBacktest();
    document.getElementById("applyTpl").onclick = () => this.applyTemplate();

    this.validateAndShow();
  }

  addStep() {
    const step = { if: "price > 100", then: "SELL" };
    this.engine.addStep(step);
    this.syncView("➕ Step adicionado.");
  }

  openJSON() {
    const modal = document.getElementById("modalJSON");
    const editor = document.getElementById("jsonEditor");
    editor.value = this.engine.getJSON();
    modal.style.display = "flex";
    document.getElementById("cancelJSON").onclick = () => modal.style.display = "none";
    document.getElementById("saveJSON").onclick = () => {
      try {
        const json = JSON.parse(editor.value);
        const res = validateStrategy(json);
        if (!res.ok) throw new Error(res.errors.join("\n"));
        this.engine.load(json);
        this.syncView("💾 JSON aplicado com sucesso.");
        modal.style.display = "none";
      } catch (e) {
        alert("Erro no JSON: " + e.message);
      }
    };
  }

  applyTemplate() {
    const sel = document.getElementById("tpl");
    const name = sel.value;
    if (!name) return;
    const tpl = Templates[name];
    if (!tpl) return;
    this.engine.load(tpl);
    this.syncView(`📦 Template aplicado: ${name}`);
  }

  validateAndShow() {
    const res = validateStrategy(JSON.parse(this.engine.getJSON()));
    const box = document.getElementById("validation");
    if (res.ok) {
      box.innerHTML = `<div class="ok">✔ Estratégia válida.</div>`;
    } else {
      box.innerHTML = `<div class="error">✖ Erros:<br>${res.errors.map(e => "- " + e).join("<br>")}</div>`;
    }
  }

  quickBacktest() {
    this.validateAndShow();
    document.getElementById("status").textContent = "⚡ Quick check executado (para backtest completo, use a tela principal).";
  }

  syncView(msg) {
    document.getElementById("algoView").textContent = this.engine.getJSON();
    document.getElementById("status").textContent = msg;
    this.validateAndShow();
    Sync.saveStrategy(JSON.parse(this.engine.getJSON()));
  }
}
