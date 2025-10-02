// index.js — bootstrap Fase 7

// estado central
let sharedData = Storage.loadData('oalgo-shared') || {
  steps: [
    { action: "BUY",  op: "<", value: 100 },
    { action: "SELL", op: ">", value: 140 }
  ]
};

// LEGO UI
const legoRoot = document.getElementById('lego');
LegoUI.init(legoRoot, sharedData, onLegoChange);

// JSON Editor
const editor = new JSONEditor(document.getElementById('jsoneditor'), {
  mode: 'tree',
  onChange: onJsonChange
});
let ignoreJson = false;
editor.set(sharedData);

// Dados de preço (demo): caminhada aleatória suave
const prices = generateSeries(300, 120, 0.6);

// Chart + Bridge
const ctx = document.getElementById('btChart').getContext('2d');
const chart = BridgeOChart.createChart(ctx, prices);
const engine = OAlgoEngine.create(sharedData);
const backtest = Backtest.create(prices, engine, chart);

// Controles
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');
const speedInp = document.getElementById('speed');

btnStart.onclick = () => backtest.start(parseInt(speedInp.value || 150, 10));
btnPause.onclick = () => backtest.pause();
btnReset.onclick = () => backtest.reset();

function onLegoChange() {
  // Persistir e refletir no JSON
  Storage.saveData('oalgo-shared', sharedData);
  ignoreJson = true;
  editor.set(sharedData);
  ignoreJson = false;
  // Atualizar engine com novas regras
  engine.updateRules(sharedData);
}

function onJsonChange() {
  if (ignoreJson) return;
  try {
    const json = editor.get();
    sharedData = normalizeAlgo(json);
    LegoUI.update(sharedData);
    Storage.saveData('oalgo-shared', sharedData);
    engine.updateRules(sharedData);
  } catch (e) {
    // JSON inválido -> Lego prevalece
    ignoreJson = true;
    editor.set(sharedData);
    ignoreJson = false;
  }
}

// Normaliza estrutura de regras (caso venham no formato antigo)
function normalizeAlgo(json) {
  const safe = { steps: [] };
  if (!json || !Array.isArray(json.steps)) return sharedData;
  safe.steps = json.steps.map(s => {
    if (s && typeof s === 'object' && 'action' in s && 'op' in s && 'value' in s) return s;
    // migração simples: {name, value} -> SELL >
    return { action: "SELL", op: ">", value: Number(s.value) || 0 };
  });
  return safe;
}

// Gera série de preços (random walk suave)
function generateSeries(n, base=100, vol=1.0) {
  const out = [];
  let p = base;
  for (let i=0;i<n;i++) {
    const drift = (Math.sin(i/25) + Math.cos(i/17)) * 0.6;
    const step = (Math.random()-0.5) * vol + drift*0.2;
    p = Math.max(1, p + step);
    out.push(Number(p.toFixed(2)));
  }
  return out;
}
