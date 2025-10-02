// C:\4Avalon\projetos\oraculum\oalgo\core\strategy-schema.js
// v12.4 — funções utilitárias de validação/geração de estratégia
export function makeDefaultStrategy() {
  return {
    name: "OAlgo Strategy",
    params: {
      orderSize: 1,
      commission: 0,
      slippage: 0
    },
    steps: [
      { if: "price > 100", then: "SELL" },
      { if: "price < 80", then: "BUY" }
    ]
  };
}

export function validateStrategy(json) {
  const errors = [];
  if (!json || typeof json !== "object") {
    errors.push("Strategy must be an object.");
    return { ok: false, errors };
  }
  if (!Array.isArray(json.steps)) {
    errors.push("Missing 'steps' (array).");
  } else {
    json.steps.forEach((s, i) => {
      if (!s || typeof s !== "object") errors.push(`Step[${i}] must be an object.`);
      if (!s.if) errors.push(`Step[${i}] missing 'if'.`);
      if (!s.then) errors.push(`Step[${i}] missing 'then'.`);
    });
  }
  return { ok: errors.length === 0, errors };
}
