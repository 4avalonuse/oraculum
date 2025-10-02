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
      <pre id="algoView">{}</pre>
    `;
    document.getElementById("addStep").onclick = () => this.addStep();
  }

  addStep() {
    const step = { if: "price > 100", then: "SELL" };
    this.engine.addStep(step);
    document.getElementById("algoView").textContent = this.engine.getJSON();
  }
}
