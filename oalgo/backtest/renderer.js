// oalgo/backtest/renderer.js
import { COLORS, priceRange, fmtMoney, toDateStr } from './utils.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  setupHiDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  drawAll({ candles, startIndex, endIndex, currentIndex, indicators, trades, history }) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    this.ctx.clearRect(0,0,w,h);
    const priceHeight = h*0.7;
    const equityHeight = h*0.3;
    this.drawPriceChart(0,0,w,priceHeight, candles, startIndex, endIndex, currentIndex, indicators, trades);
    this.drawEquityChart(0,priceHeight,w,equityHeight, history);
  }

  drawPriceChart(x,y,width,height, candles, startIndex, endIndex, currentIndex, indicators, trades) {
    const ctx = this.ctx;
    const padding = 15;
    const windowSize = Math.max(10, Math.min(100, endIndex-startIndex));
    const endIdx = Math.min(currentIndex+1, endIndex);
    const startIdx = Math.max(startIndex, endIdx - windowSize);
    const visible = candles.slice(startIdx, endIdx);
    if (!visible.length) return;

    // background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x,y,width,height);

    const { min, max, range } = priceRange(visible);
    const minPrice = min*0.998, maxPrice = max*1.002;
    const prange = (maxPrice - minPrice)||1;
    const scaleY = (p)=> y + padding + (1 - (p - minPrice)/prange) * (height - 2*padding);
    const candleW = (width - 2*padding - 60)/windowSize;

    // grid + labels
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "#666";
    for (let i=0;i<=5;i++) {
      const p = minPrice + (prange*i/5);
      const py = scaleY(p);
      ctx.beginPath(); ctx.moveTo(x+padding, py); ctx.lineTo(x+width-60, py); ctx.stroke();
      ctx.fillText(p.toFixed(2), x+width-5, py+3);
    }

    // candles
    visible.forEach((c,i)=>{
      const cx = x + padding + i*candleW + candleW/2;
      const openY = scaleY(c.o), closeY=scaleY(c.c), highY=scaleY(c.h), lowY=scaleY(c.l);
      const bull = c.c >= c.o;
      ctx.strokeStyle = bull ? COLORS.bullish : COLORS.bearish;
      ctx.beginPath(); ctx.moveTo(cx, highY); ctx.lineTo(cx, lowY); ctx.stroke();
      const bw = Math.max(1, candleW*0.7);
      const bh = Math.abs(closeY-openY)||1;
      const by = Math.min(openY, closeY);
      ctx.fillStyle = bull ? COLORS.bullish : COLORS.bearish;
      ctx.fillRect(cx - bw/2, by, bw, bh);
      if (i===visible.length-1) {
        ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
        ctx.strokeRect(cx - bw/2 -2, by-2, bw+4, bh+4);
        ctx.lineWidth = 1;
      }
    });

    // indicators
    if (indicators?.sma20) this.drawLine(indicators.sma20, startIdx, endIdx, startIndex, x, y, height, padding, candleW, minPrice, prange, "#3b82f6", 1.5);
    if (indicators?.sma50) this.drawLine(indicators.sma50, startIdx, endIdx, startIndex, x, y, height, padding, candleW, minPrice, prange, "#f59e0b", 1.5);
    if (indicators?.bb) {
      this.drawBB(indicators.bb, startIdx, endIdx, startIndex, x, y, height, padding, candleW, minPrice, prange, "#9ca3af");
    }

    // trades arrows
    if (Array.isArray(trades)) {
      trades.forEach(t => {
        if (t.entryTime>=startIdx && t.entryTime<endIdx) {
          const i = t.entryTime - startIdx;
          const cx = x+padding + i*candleW + candleW/2;
          const cy = scaleY(t.entry);
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.moveTo(cx, cy+10); ctx.lineTo(cx-4,cy+18); ctx.lineTo(cx+4,cy+18); ctx.closePath(); ctx.fill();
        }
        if (t.exitTime>=startIdx && t.exitTime<endIdx) {
          const i = t.exitTime - startIdx;
          const cx = x+padding + i*candleW + candleW/2;
          const cy = scaleY(t.exit);
          ctx.fillStyle = t.profit>0 ? "#10b981" : "#ef4444";
          ctx.beginPath();
          ctx.moveTo(cx, cy-10); ctx.lineTo(cx-4,cy-18); ctx.lineTo(cx+4,cy-18); ctx.closePath(); ctx.fill();
          ctx.font = "10px monospace"; ctx.textAlign="center"; ctx.fillStyle="#111";
          ctx.fillText(`${t.profitPct>0?'+':''}${t.profitPct.toFixed(1)}%`, cx, cy-24);
        }
      });
    }

    // title row
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign="left";
    const current = candles[Math.min(currentIndex, endIndex-1)];
    if (current && typeof current.c==="number") {
      ctx.fillText(`${current.c.toFixed(2)}`, x+padding, y+12);
      if (typeof current.o==="number" && current.o!==0) {
        const ch = (current.c - current.o)/current.o*100;
        ctx.fillStyle = ch>=0 ? "#10b981" : "#ef4444";
        ctx.font = "12px sans-serif";
        ctx.fillText(`${ch>=0?'+':''}${ch.toFixed(2)}%`, x+padding+80, y+12);
      }
      ctx.fillStyle="#666";
      ctx.font="11px monospace";
      ctx.fillText(toDateStr(current.t), x+padding+150, y+12);
    }
  }

  drawLine(series, startIdx, endIdx, startIndex, x,y,height,padding,candleW,minPrice,prange,color,width) {
    const ctx = this.ctx;
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    let started = false;
    for (let i=0;i<endIdx-startIdx;i++) {
      const g = startIdx + i - startIndex;
      const v = series[g];
      if (v==null) continue;
      const px = x + padding + i*candleW + candleW/2;
      const py = y + padding + (1 - (v - minPrice)/prange) * (height - 2*padding);
      if (!started) { ctx.moveTo(px,py); started=true; } else { ctx.lineTo(px,py); }
    }
    ctx.stroke();
  }

  drawBB(bands, startIdx, endIdx, startIndex, x,y,height,padding,candleW,minPrice,prange,color) {
    const ctx = this.ctx;
    ctx.setLineDash([2,2]); ctx.strokeStyle = color; ctx.lineWidth=1;
    // upper
    ctx.beginPath();
    let started=false;
    for (let i=0;i<endIdx-startIdx;i++) {
      const g = startIdx + i - startIndex;
      const b = bands[g]; if (!b||b.upper==null) continue;
      const px = x + padding + i*candleW + candleW/2;
      const py = y + padding + (1 - (b.upper - minPrice)/prange) * (height - 2*padding);
      if (!started) { ctx.moveTo(px,py); started=true; } else { ctx.lineTo(px,py); }
    }
    ctx.stroke();
    // lower
    ctx.beginPath(); started=false;
    for (let i=0;i<endIdx-startIdx;i++) {
      const g = startIdx + i - startIndex;
      const b = bands[g]; if (!b||b.lower==null) continue;
      const px = x + padding + i*candleW + candleW/2;
      const py = y + padding + (1 - (b.lower - minPrice)/prange) * (height - 2*padding);
      if (!started) { ctx.moveTo(px,py); started=true; } else { ctx.lineTo(px,py); }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawEquityChart(x,y,width,height, history) {
    const ctx = this.ctx;
    if (!history || history.length<2) return;
    const padding=15;
    ctx.fillStyle="#f9fafb"; ctx.fillRect(x,y,width,height);
    const vals = history.map(h=>h.y);
    const min = Math.min(...vals)*0.995, max=Math.max(...vals)*1.005, range=(max-min)||1;
    const scaleX = (i)=> x+padding + (i/(history.length-1))*(width-2*padding-60);
    const scaleY = (v)=> y+padding + (1 - (v-min)/range)*(height-2*padding);
    // break-even
    const beY = scaleY(history[0].balance);
    ctx.strokeStyle="#cbd5e1"; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(x+padding,beY); ctx.lineTo(x+width-60,beY); ctx.stroke(); ctx.setLineDash([]);
    // fill
    const rising = history[history.length-1].y >= history[0].balance;
    const grad = ctx.createLinearGradient(0,y,0,y+height);
    if (rising){ grad.addColorStop(0,"rgba(16,185,129,0.1)"); grad.addColorStop(1,"rgba(16,185,129,0)"); }
    else { grad.addColorStop(0,"rgba(239,68,68,0.1)"); grad.addColorStop(1,"rgba(239,68,68,0)"); }
    ctx.fillStyle = grad; ctx.beginPath();
    history.forEach((p,i)=>{ const px=scaleX(i), py=scaleY(p.y); if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); });
    ctx.lineTo(scaleX(history.length-1), y+height-padding); ctx.lineTo(scaleX(0), y+height-padding); ctx.closePath(); ctx.fill();
    // line
    ctx.strokeStyle = rising ? "#10b981" : "#ef4444"; ctx.lineWidth=2; ctx.beginPath();
    history.forEach((p,i)=>{ const px=scaleX(i), py=scaleY(p.y); if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }); ctx.stroke();
    // labels
    ctx.fillStyle="#666"; ctx.font="10px monospace"; ctx.textAlign="right";
    ctx.fillText(`${max.toFixed(0)}`, x+width-5, y+padding);
    ctx.fillText(`${history[0].balance}`, x+width-5, beY+3);
    ctx.fillText(`${min.toFixed(0)}`, x+width-5, y+height-padding);
    // title
    ctx.fillStyle="#1f2937"; ctx.font="bold 12px sans-serif"; ctx.textAlign="left";
    ctx.fillText("Equity", x+padding, y+12);
  }
}
