// oalgo/backtest/indicators.js
import { isNum } from './utils.js';

export function SMA(data, period) {
  const out = new Array(data.length).fill(null);
  if (period <= 1) return data.slice();
  let sum = 0;
  for (let i=0;i<data.length;i++) {
    const v = data[i];
    if (!isNum(v)) continue;
    sum += v;
    if (i>=period) sum -= data[i-period];
    if (i>=period-1) out[i] = sum / period;
  }
  return out;
}

export function EMA(data, period) {
  const out = new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  let prev = null;
  for (let i=0;i<data.length;i++) {
    const v = data[i];
    if (!isNum(v)) continue;
    prev = prev==null ? v : (v - prev) * k + prev;
    out[i] = prev;
  }
  return out;
}

export function Bollinger(data, period=20, stdDev=2) {
  const mid = SMA(data, period);
  const bands = new Array(data.length).fill(null);
  for (let i=0;i<data.length;i++) {
    if (i<period-1 || !isNum(mid[i])) continue;
    const slice = data.slice(i-period+1, i+1).filter(isNum);
    const mean = mid[i];
    let variance = 0;
    for (const v of slice) variance += Math.pow(v-mean, 2);
    variance /= period;
    const sd = Math.sqrt(variance);
    bands[i] = {
      upper: mean + sd*stdDev,
      middle: mean,
      lower: mean - sd*stdDev
    };
  }
  return bands;
}

export function RSI(data, period=14) {
  const out = new Array(data.length).fill(null);
  if (data.length<2) return out;
  let gains=0, losses=0;
  for (let i=1;i<=period;i++) {
    const ch = data[i]-data[i-1];
    gains += ch>0 ? ch:0;
    losses += ch<0 ? -ch:0;
  }
  let avgGain = gains/period;
  let avgLoss = losses/period;
  out[period] = avgLoss===0 ? 100 : 100 - (100/(1+avgGain/avgLoss));
  for (let i=period+1;i<data.length;i++) {
    const ch = data[i]-data[i-1];
    const gain = ch>0 ? ch:0;
    const loss = ch<0 ? -ch:0;
    avgGain = (avgGain*(period-1)+gain)/period;
    avgLoss = (avgLoss*(period-1)+loss)/period;
    out[i] = avgLoss===0 ? 100 : 100 - (100/(1+avgGain/avgLoss));
  }
  return out;
}
