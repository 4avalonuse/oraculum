// oalgo/ui/lego.js
import OAlgoEngine from "../core/OAlgoEngine.js";

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
      <pre id="algoView">{}</pre>
    `;

    document.getElementById("addStep").onclick = () => this.addStep();
    document.getElementById("removeStep").onclick = () => this.removeStep();

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

  updateView() {
    document.getElementById("algoView").textContent = this.engine.getJSON();
  }
}
