// C:\4Avalon\projetos\oraculum\oalgo\core\sync.js
// v12.4 — sincronização leve via localStorage
const KEY = "oalgo:strategy";

export const Sync = {
  saveStrategy(obj) {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch {}
  },
  loadStrategy() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
};
