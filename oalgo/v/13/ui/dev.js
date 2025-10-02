// C:\4Avalon\projetos\oraculum\oalgo\ui\dev.js
// v12.4 — Dev com validação ao digitar, autosave e botão "Aplicar"
import OAlgoEngine from "../core/OAlgoEngine.js";
import { validateStrategy } from "../core/strategy-schema.js";
import { Sync } from "../core/sync.js";

export default class DevUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.engine = new OAlgoEngine();
    this.render();
  }

  render() {
    const saved = this.engine.getJSON();
    this.container.innerHTML = `
      <style>
        .row { display:flex; gap:8px; align-items:center; }
        .ok { color:#065f46; font-size:12px; }
        .error { color:#b91c1c; font-size:12px; white-space:pre-wrap; }
        textarea.code { width:100%; height:260px; font-family: ui-monospace, Menlo, monospace; font-size:12px; }
      </style>
      <h2>Dev Mode <span style="font-size:12px; background:#eef2ff; padding:2px 6px; border-radius:6px;">v12.4</span></h2>
      <div class="row">
        <button id="applyAlgo">▶️ Aplicar</button>
        <span id="status">Pronto.</span>
      </div>
      <textarea id="devEditor" class="code"></textarea>
      <div id="validation"></div>
    `;
    const editor = document.getElementById("devEditor");
    editor.value = saved;
    editor.addEventListener("input", () => this.liveValidate(editor.value));
    document.getElementById("applyAlgo").onclick = () => this.apply(editor.value);
    this.liveValidate(saved);
  }

  liveValidate(text) {
    try {
      const json = JSON.parse(text);
      const res = validateStrategy(json);
      if (res.ok) {
        document.getElementById("validation").innerHTML = `<div class="ok">✔ Estratégia válida.</div>`;
        Sync.saveStrategy(json);
      } else {
        document.getElementById("validation").innerHTML = `<div class="error">✖ Erros:\n${res.errors.map(e => "- " + e).join("\n")}</div>`;
      }
    } catch (e) {
      document.getElementById("validation").innerHTML = `<div class="error">✖ JSON inválido: ${e.message}</div>`;
    }
  }

  apply(text) {
    try {
      const json = JSON.parse(text);
      const res = validateStrategy(json);
      if (!res.ok) throw new Error(res.errors.join("; "));
      this.engine.load(json);
      document.getElementById("status").textContent = "✅ Strategy aplicada.";
    } catch (e) {
      document.getElementById("status").textContent = "❌ " + e.message;
    }
  }
}
