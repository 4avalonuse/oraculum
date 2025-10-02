// oalgo/index.js
import OAlgoEngine from "./core/OAlgoEngine.js";

const engine = new OAlgoEngine();

// exemplo de uso
engine.addStep({ if: "price > 100", then: "SELL" });
engine.addStep({ if: "price < 80", then: "BUY" });

console.log("📄 Algorithm JSON:", engine.getJSON());
engine.run({ price: 95 });
