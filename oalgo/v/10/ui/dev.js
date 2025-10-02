import OAlgoEngine from "../core/OAlgoEngine.js";

export default class DevUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.engine = new OAlgoEngine();
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <h2>Dev Mode</h2>
      <textarea id="devEditor" style="width:100%;height:200px;"></textarea>
      <button id="applyAlgo">▶️ Apply</button>
      <pre id="status">Ready.</pre>
    `;
    document.getElementById("applyAlgo").onclick = () => this.apply();
    document.getElementById("devEditor").value = JSON.stringify(this.engine.algorithm, null, 2);
  }

  apply() {
    try {
      const code = document.getElementById("devEditor").value;
      const json = JSON.parse(code);
      this.engine.load(json);
      document.getElementById("status").textContent = "✅ Algorithm applied.";
    } catch {
      document.getElementById("status").textContent = "❌ Invalid JSON!";
    }
  }
}
