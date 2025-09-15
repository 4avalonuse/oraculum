// State store com persistência e ring buffer de logs
const SCHEMA_VERSION = 2;
const PERSIST_KEY = 'oraculum_store';
const PERSIST = [
  'app.mode',
  'app.theme',
  'data.timeframe',
  'data.symbol',
  'ui.devHudVisible',
  'data.btc.lastSync',
  'data.source',
  // novas prefs
  'settings.theme',
  'settings.autoRefresh',
  'settings.widgets',
  'settings.bots',
  'settings.rules'
];

const state = {
  app: { page:'dashboard', mode:'simulation', theme:'auto' },
  data: { source:'yahoo', symbol:'BTC-USD', timeframe:'1d', btc:{ ohlc:[], lastSync:null }, cache:{} },
  ui: { loading:false, error:null, toast:null, devHudVisible:false },
  // preferências globais (persistem)
  settings: {
    theme: 'auto',                 // 'light' | 'dark' | 'auto'
    autoRefresh: 0,                // em segundos (0 = off)
    widgets: { price:true, kpis:false, chart:true, table:false },
    bots: { allEnabled:false },
    rules: { enabled:false, tp:10, sl:5, trailing:0 } // %; trailing opcional
  },
  logs: { ring: [] } // {ts,level,msg,data}
};

const subs = new Set();

function deepGet(obj, path){
  return path.split('.').reduce((o,k)=> (o&&k in o)? o[k] : undefined, obj);
}
function deepSet(obj, path, val){
  const keys = path.split('.');
  let o = obj;
  keys.slice(0,-1).forEach(k=> { if(!(k in o)) o[k] = {}; o = o[k]; });
  o[keys[keys.length-1]] = val;
}

function save(){
  try{
    const out = { v: SCHEMA_VERSION };
    for(const key of PERSIST){
      const val = deepGet(state, key);
      if(val !== undefined) deepSet(out, key, val);
    }
    localStorage.setItem(PERSIST_KEY, JSON.stringify(out));
  }catch{}
}
function load(){
  try{
    const raw = JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}');
    if(raw.v !== SCHEMA_VERSION) return;
    for(const key of PERSIST){
      const val = deepGet(raw, key);
      if(val !== undefined) deepSet(state, key, val);
    }
  }catch{}
}
load();

export const getState = ()=> structuredClone(state);
export const subscribe = (fn)=> (subs.add(fn), ()=>subs.delete(fn));
function emit(){ save(); subs.forEach(fn=> fn(getState())); }

function pushRing(ev){
  const r = state.logs.ring;
  r.push(ev);
  if(r.length > 500) r.shift();
}

export const actions = {
  // app/data
  setPage: (page)=> { state.app.page = page; emit(); },
  setMode: (mode)=> { state.app.mode = mode; emit(); },
  setTheme: (theme)=> { 
    state.app.theme = theme; 
    state.settings.theme = theme;
    emit(); 
  },
  setTimeframe: (tf)=> { state.data.timeframe = tf; emit(); },
  setSymbol: (sym)=> { state.data.symbol = sym; emit(); },

  // ui
  setLoading: (v)=> { state.ui.loading = v; emit(); },
  setError: (e)=> { state.ui.error = e; emit(); },
  toast: (text)=> { state.ui.toast = { text, ts: Date.now() }; emit(); },
  toggleDevHud: (v)=> { state.ui.devHudVisible = v ?? !state.ui.devHudVisible; emit(); },
  toggleSettings: (v)=> { const ev = new CustomEvent('oraculum:settings', { detail: { open: v }}); window.dispatchEvent(ev); },

  // dados
  setBtcSeries: (ohlc, meta={})=>{
    state.data.btc.ohlc = ohlc;
    state.data.btc.lastSync = meta.lastSync ?? Date.now();
    state.data.source = meta.source ?? state.data.source;
    emit();
  },

  // settings globais
  setAutoRefresh: (seconds)=> { state.settings.autoRefresh = Math.max(0, Math.floor(seconds||0)); emit(); },
  setWidgets: (partial)=> { state.settings.widgets = { ...state.settings.widgets, ...partial }; emit(); },
  setBotsAllEnabled: (v)=> { state.settings.bots.allEnabled = !!v; emit(); },
  setRules: (partial)=> { state.settings.rules = { ...state.settings.rules, ...partial }; emit(); },
  toggleRulesEnabled: (v)=> { state.settings.rules.enabled = v ?? !state.settings.rules.enabled; emit(); },

  // logs
  pushLog: (ev)=> { pushRing(ev); emit(); },
  clearLogs: ()=> { state.logs.ring = []; emit(); }
};
