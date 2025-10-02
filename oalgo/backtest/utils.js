// oalgo/backtest/utils.js
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
export const safe = (x, d=0) => (isNum(x) ? x : d);
export const lerp = (a,b,t)=> a + (b-a)*t;

export function pick(array, i, fallback=null) {
  if (!Array.isArray(array)) return fallback;
  if (i < 0 || i >= array.length) return fallback;
  return array[i];
}

export function fmtMoney(v) {
  const sign = v >= 0 ? '' : '-';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${sign}${(abs/1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs/1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs/1e3).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

export function priceRange(arr) {
  const vals = arr.flatMap(c => [c.o, c.h, c.l, c.c]).filter(isNum);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return { min, max, range: (max-min)||1 };
}

export function toDateStr(ts) {
  const d = new Date(isNum(ts) ? (ts>1e12?ts:ts*1000) : Date.now());
  return d.toLocaleDateString();
}

export const COLORS = {
  bullish: "#10b981",
  bearish: "#ef4444",
  primary: "#3b82f6",
  grid: "#f0f0f0",
  text: "#1f2937",
  subtext: "#666",
  profit: "#10b981",
  loss: "#ef4444",
};
