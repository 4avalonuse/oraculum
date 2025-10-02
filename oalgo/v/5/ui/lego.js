// oalgo/ui/lego.js
import OAlgoEngine from "../core/OAlgoEngine.js";
import Storage from "../core/Storage.js";

export default class LegoUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.engine = new OAlgoEngine();
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <h2>Lego Mode</h2>
      <button id="addStep">➕ Add Step</button>
      <button id="removeStep">➖ Remove Last Step</button>
      <button id="saveAlgo">💾 Save</button>
      <button id="loadAlgo">📂 Load</button>
      <input type="file" id="uploadFile" style="display:none" />
      <pre id="algoView">{}</pre>
    `;

    document.getElementById("addStep").onclick = () => this.addStep();
    document.getElementById("removeStep").onclick = () => this.removeStep();
    document.getElementById("saveAlgo").onclick = () => this.save();
    document.getElementById("loadAlgo").onclick = () => this.load();

    this.updateView();
  }

  addStep() {
    const step = { if: "price > 100", then: "SELL" };
    this.engine.addStep(step);
    this.updateView();
  }

  removeStep() {
    this.engine.algorithm.steps.pop();
    console.log("❌ Step removed");
    this.updateView();
  }

  save() {
    Storage.save("oalgo-current", this.engine.algorithm);
    Storage.download("algorithm.json", this.engine.algorithm);
  }

  load() {
    const algo = Storage.load("oalgo-current");
    if (algo) {
      this.engine.load(algo);
      this.updateView();
      return;
    }

    const input = document.getElementById("uploadFile");
    input.click();
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        Storage.upload(file, (json) => {
          this.engine.load(json);
          this.updateView();
        });
      }
    };
  }

  updateView() {
    document.getElementById("algoView").textContent = this.engine.getJSON();
  }
}
