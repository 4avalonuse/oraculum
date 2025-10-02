// oalgo/ui/dev.js
import OAlgoEngine from "../core/OAlgoEngine.js";
import Storage from "../core/Storage.js";

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
      <br/>
      <button id="applyAlgo">▶️ Apply</button>
      <button id="saveAlgo">💾 Save</button>
      <pre id="status">Ready.</pre>
    `;

    document.getElementById("applyAlgo").onclick = () => this.apply();
    document.getElementById("saveAlgo").onclick = () => this.save();

    document.getElementById("devEditor").value = JSON.stringify(this.engine.algorithm, null, 2);
  }

  apply() {
    try {
      const code = document.getElementById("devEditor").value;
      const json = JSON.parse(code);
      this.engine.load(json);
      document.getElementById("status").textContent = "✅ Algorithm applied.";
    } catch (e) {
      console.error("⚠️ Invalid JSON:", e);
      document.getElementById("status").textContent = "❌ Invalid JSON!";
    }
  }

  save() {
    Storage.save("oalgo-current", this.engine.algorithm);
    Storage.download("algorithm.json", this.engine.algorithm);
  }
}
