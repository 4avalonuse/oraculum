// index.js — Fase 8 (dados reais + backtest)

// estado central com regras padrão
let sharedData = Storage.loadData('oalgo-shared') || {
  steps: [
    { action: "BUY",  op: "<", value: 60000 },
    { action: "SELL", op: ">", value: 65000 }
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

// Chart + Bridge
const ctx = document.getElementById('btChart').getContext('2d');
let chart = null;
let engine = OAlgoEngine.create(sharedData);
let backtest = null;
let prices = []; // série atual

// Carregamento de dados
const endpointInp = document.getElementById('endpoint');
const symbolInp   = document.getElementById('symbol');
const countInp    = document.getElementById('count');
const loadBtn     = document.getElementById('btnLoad');
const loadStatus  = document.getElementById('loadStatus');

loadBtn.onclick = async () => {
  loadStatus.textContent = 'Carregando...';
  try {
    const url = buildUrl(endpointInp.value, symbolInp.value, Number(countInp.value||300));
    const resp = await DataSource.fetchOHLC(url);
    prices = DataSource.ohlcToClose(resp);
    if (!prices || prices.length === 0) throw new Error('Sem preços retornados');
    // (re)criar chart/backtest
    chart?.destroy?.();
    chart = BridgeOChart.createChart(ctx, prices);
    backtest = Backtest.create(prices, engine, chart);
    loadStatus.textContent = `OK: ${prices.length} pontos`;
  } catch (e) {
    console.error(e);
    loadStatus.textContent = 'Falha no load — usando random walk';
    prices = generateSeries(300, 120, 0.6);
    chart?.destroy?.();
    chart = BridgeOChart.createChart(ctx, prices);
    backtest = Backtest.create(prices, engine, chart);
  }
};

// Carregar ao iniciar (tentativa)
loadBtn.click();

// Controles do backtest
document.getElementById('btnStart').onclick = () => backtest?.start(parseInt(document.getElementById('speed').value||120,10));
document.getElementById('btnPause').onclick = () => backtest?.pause();
document.getElementById('btnReset').onclick = () => backtest?.reset();

function onLegoChange() {
  Storage.saveData('oalgo-shared', sharedData);
  ignoreJson = true;
  editor.set(sharedData);
  ignoreJson = false;
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

function normalizeAlgo(json) {
  const safe = { steps: [] };
  if (!json || !Array.isArray(json.steps)) return sharedData;
  safe.steps = json.steps.map(s => {
    if (s && typeof s === 'object' && 'action' in s && 'op' in s && 'value' in s) return s;
    return { action: "SELL", op: ">", value: Number(s.value) || 0 };
  });
  return safe;
}

// Utilidades
function buildUrl(base, symbol, count){
  const hasQ = base.includes('?');
  const sep = hasQ ? '&' : '?';
  return `${base}${sep}symbol=${encodeURIComponent(symbol)}&count=${encodeURIComponent(count)}`;
}
function generateSeries(n, base=100, vol=1.0) {
  const out = []; let p = base;
  for (let i=0;i<n;i++) {
    const drift = (Math.sin(i/25) + Math.cos(i/17)) * 0.6;
    const step = (Math.random()-0.5) * vol + drift*0.2;
    p = Math.max(1, p + step);
    out.push(Number(p.toFixed(2)));
  }
  return out;
}
