// oalgo/core/OAlgoEngine.js
export default class OAlgoEngine {
  constructor() {
    this.algorithm = { name: "New Algorithm", steps: [] };
  }

  load(json) {
    if (!json || !json.steps) {
      throw new Error("Invalid algorithm JSON");
    }
    this.algorithm = json;
    console.log("✅ Algorithm loaded:", this.algorithm);
  }

  addStep(step) {
    this.algorithm.steps.push(step);
    console.log("➕ Step added:", step);
  }

  getJSON() {
    return JSON.stringify(this.algorithm, null, 2);
  }

  run(context = {}) {
    console.log("▶️ Running algorithm with context:", context);
    this.algorithm.steps.forEach((s, i) => {
      console.log(`Step ${i + 1}:`, s);
    });
  }
}
