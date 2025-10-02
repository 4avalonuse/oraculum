// oalgo/backtest/backtest.js
// Orquestrador modular – mantém o comportamento anterior e UI player
import { SMA, Bollinger, RSI } from './indicators.js';
import { Renderer } from './renderer.js';
import { Portfolio } from './portfolio.js';
import { summarize } from './metrics.js';
import { clamp, toDateStr } from './utils.js';

export default class Backtest {
  constructor(engine, candles, canvas, bridge=null) {
    this.engine = engine;
    this.candles = candles;
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.bridge = bridge;
    // state
    this.state = 'idle';
    this.currentIndex = 0;
    this.startIndex = 0;
    this.endIndex = Math.min(100, candles.length);
    this.speed = 1;
    this.baseSpeed = 100;
    // portfolio
    const p = engine?.algorithm?.params || {};
    this.portfolio = new Portfolio({
      initialBalance: 10000,
      orderSize: p.orderSize || 1,
      commission: p.commission || 0.001,
      slippage: p.slippage || 0.0005
    });
    // indicators cache
    this.indicators = {};
    // init
    this.renderer.setupHiDPI();
    this.createPlayerControls();
    this.precalcIndicators();
    this.draw();
  }

  // ===== UI Player =====
  createPlayerControls() {
    const old = document.getElementById('backtestPlayer');
    if (old) old.remove();
    const html = `
      <div id="backtestPlayer" style="margin-top:10px;background:#1a1a1a;border-radius:8px;padding:12px;color:#fff;font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <div style="position:relative;margin-bottom:12px;">
          <div id="progressBar" style="width:100%;height:4px;background:#404040;border-radius:2px;cursor:pointer;position:relative;">
            <div id="progressFill" style="width:0%;height:100%;background:#ff0000;border-radius:2px;position:relative;">
              <div style="position:absolute;right:-6px;top:-4px;width:12px;height:12px;background:#ff0000;border-radius:50%;cursor:grab;"></div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:#999;">
            <span id="currentTime">0 / ${this.endIndex-this.startIndex}</span>
            <span id="totalTime">candles</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="playPauseBtn" style="background:none;border:none;color:#fff;cursor:pointer;padding:8px;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;">
            <svg id="playIcon" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            <svg id="pauseIcon" width="24" height="24" viewBox="0 0 24 24" fill="white" style="display:none;"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          </button>
          <button id="resetBtn" style="background:none;border:none;color:#fff;cursor:pointer;padding:8px;width:36px;height:36px;border-radius:50%;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
          </button>
          <div id="speedControl" style="margin-left:12px;padding:4px 8px;background:#333;border-radius:4px;font-size:13px;cursor:pointer;min-width:45px;text-align:center;">1x</div>
          <div style="width:1px;height:24px;background:#404040;margin:0 8px;"></div>
          <div style="display:flex;gap:16px;font-size:12px;color:#ccc;">
            <div><span style="color:#999;">Balance:</span> <span id="liveBalance" style="font-weight:600;">$10,000</span></div>
            <div><span style="color:#999;">P&L:</span> <span id="livePnL" style="font-weight:600;color:#999;">$0</span></div>
            <div><span style="color:#999;">Trades:</span> <span id="liveTrades" style="font-weight:600;">0</span></div>
            <div><span style="color:#999;">Win Rate:</span> <span id="liveWinRate" style="font-weight:600;">0%</span></div>
          </div>
          <button id="settingsBtn" style="margin-left:auto;background:none;border:none;color:#999;cursor:pointer;padding:8px;border-radius:4px;">⚙</button>
        </div>
      </div>
      <div id="settingsPanel" style="display:none;background:#2a2a2a;border-radius:8px;padding:16px;margin-top:10px;color:#fff;">
        <h3 style="margin:0 0 12px 0;font-size:14px;">Configurações do Backtest</h3>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
          <div>
            <label style="display:block;font-size:12px;color:#bbb;margin-bottom:4px;">Início (Candle #)</label>
            <input type="number" id="startCandle" min="0" max="${this.candles.length}" value="0" style="width:100%;padding:6px;background:#1a1a1a;border:1px solid #404040;border-radius:4px;color:#fff;font-size:12px;">
          </div>
          <div>
            <label style="display:block;font-size:12px;color:#bbb;margin-bottom:4px;">Número de Velas</label>
            <input type="number" id="candleRange" min="10" max="${this.candles.length}" value="${this.endIndex-this.startIndex}" style="width:100%;padding:6px;background:#1a1a1a;border:1px solid #404040;border-radius:4px;color:#fff;font-size:12px;">
          </div>
        </div>
        <div style="margin-top:12px;padding:8px;background:#1a1a1a;border-radius:4px;font-size:11px;color:#bbb;">
          <div id="datePreview">Período: --</div>
        </div>
        <div style="margin-top:12px;">
          <label style="display:block;font-size:12px;color:#bbb;margin-bottom:8px;">Períodos Rápidos</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="presetBtn" data-range="30">30 dias</button>
            <button class="presetBtn" data-range="90">90 dias</button>
            <button class="presetBtn" data-range="180">6 meses</button>
            <button class="presetBtn" data-range="365">1 ano</button>
            <button class="presetBtn" data-range="all">Tudo</button>
          </div>
        </div>
        <button id="applySettings" style="width:100%;margin-top:16px;padding:10px;background:#ff0000;border:none;border-radius:4px;color:#fff;font-size:13px;font-weight:600;">Aplicar Configurações</button>
      </div>
    `;
    this.canvas.insertAdjacentHTML('afterend', html);

    // handlers
    document.getElementById('playPauseBtn').onclick = ()=> this.togglePlayPause();
    document.getElementById('resetBtn').onclick = ()=> this.reset();
    // speed
    const speeds=[0.25,0.5,1,2,4]; let i=2;
    const speedEl = document.getElementById('speedControl');
    speedEl.onclick = ()=>{ i=(i+1)%speeds.length; this.speed=speeds[i]; speedEl.textContent = this.speed+'x'; };
    // progress click
    const bar = document.getElementById('progressBar');
    bar.onclick = (e)=>{
      const rect = bar.getBoundingClientRect();
      const pct = (e.clientX - rect.left)/rect.width;
      this.seekTo(pct);
    };
    // settings
    document.getElementById('settingsBtn').onclick = ()=>{
      const panel = document.getElementById('settingsPanel');
      panel.style.display = (panel.style.display==='none'?'block':'none');
    };
    document.getElementById('startCandle').oninput = ()=> this.updateDatePreview();
    document.getElementById('candleRange').oninput = ()=> this.updateDatePreview();
    document.getElementById('applySettings').onclick = ()=> this.applySettings();
    document.querySelectorAll('.presetBtn').forEach(btn=>{
      btn.onclick = ()=>{
        const r = btn.dataset.range;
        if (r==='all') {
          document.getElementById('startCandle').value = 0;
          document.getElementById('candleRange').value = this.candles.length;
        } else {
          const n = parseInt(r);
          document.getElementById('startCandle').value = Math.max(0, this.candles.length - n);
          document.getElementById('candleRange').value = n;
        }
        this.updateDatePreview();
      };
    });
    this.updateDatePreview();
  }

  updateDatePreview() {
    const s = parseInt(document.getElementById('startCandle').value)||0;
    const r = parseInt(document.getElementById('candleRange').value)||100;
    const e = Math.min(s+r, this.candles.length);
    const a = this.candles[s], b=this.candles[e-1];
    const txt = (a&&b) ? `Período: ${toDateStr(a.t)} até ${toDateStr(b.t)} (${e-s} candles)` : 'Período: --';
    document.getElementById('datePreview').textContent = txt;
  }

  applySettings() {
    const s = parseInt(document.getElementById('startCandle').value)||0;
    const r = parseInt(document.getElementById('candleRange').value)||100;
    this.startIndex = clamp(s, 0, Math.max(0, this.candles.length-10));
    this.endIndex = clamp(this.startIndex + r, this.startIndex+10, this.candles.length);
    this.reset();
    this.precalcIndicators();
    document.getElementById('currentTime').textContent = `0 / ${this.endIndex-this.startIndex}`;
    document.getElementById('totalTime').textContent = 'candles';
    document.getElementById('settingsPanel').style.display='none';
  }

  // ===== Engine Loop =====
  togglePlayPause() {
    if (this.state==='idle' || this.state==='paused') this.play();
    else if (this.state==='running') this.pause();
    else if (this.state==='completed') { this.reset(); this.play(); }
  }
  play() {
    this.state='running';
    document.getElementById('playIcon').style.display='none';
    document.getElementById('pauseIcon').style.display='block';
    if (this.currentIndex===0) this.currentIndex = this.startIndex;
    this.loop();
  }
  pause() {
    this.state='paused';
    document.getElementById('playIcon').style.display='block';
    document.getElementById('pauseIcon').style.display='none';
  }
  reset() {
    this.state='idle';
    this.currentIndex = this.startIndex;
    this.portfolio = new Portfolio({
      initialBalance: 10000,
      orderSize: this.engine?.algorithm?.params?.orderSize || 1,
      commission: this.engine?.algorithm?.params?.commission || 0.001,
      slippage: this.engine?.algorithm?.params?.slippage || 0.0005
    });
    document.getElementById('playIcon').style.display='block';
    document.getElementById('pauseIcon').style.display='none';
    document.getElementById('progressFill').style.width='0%';
    document.getElementById('currentTime').textContent = `0 / ${this.endIndex-this.startIndex}`;
    this.updateLiveStats();
    this.draw();
  }

  seekTo(pct) {
    const target = this.startIndex + Math.floor((this.endIndex-this.startIndex)*pct);
    if (target > this.currentIndex) {
      while (this.currentIndex < target && this.currentIndex < this.endIndex) {
        this.processCandle(this.candles[this.currentIndex]);
        this.currentIndex++;
      }
    } else {
      this.reset();
      while (this.currentIndex < target && this.currentIndex < this.endIndex) {
        this.processCandle(this.candles[this.currentIndex]);
        this.currentIndex++;
      }
    }
    this.updateProgress(); this.draw();
  }

  loop() {
    if (this.state!=='running' || this.currentIndex>=this.endIndex) {
      if (this.currentIndex>=this.endIndex) this.onComplete();
      return;
    }
    const candle = this.candles[this.currentIndex];
    this.processCandle(candle);
    this.currentIndex++;
    this.updateProgress(); this.updateLiveStats(); this.draw();
    setTimeout(()=>this.loop(), this.baseSpeed/this.speed);
  }

  processCandle(c) {
    const ctx = { price:c.c, open:c.o, high:c.h, low:c.l, volume:c.v||0, t:c.t||this.currentIndex };
    this.engine.run(ctx);
    const sig = this.engine.lastSignal;
    if (sig==="BUY" && !this.portfolio.position) this.portfolio.buy(c, this.currentIndex);
    if (sig==="SELL" && this.portfolio.position==="LONG") this.portfolio.sell(c, this.currentIndex);
    this.portfolio.markToMarket(c, this.currentIndex);
    if (sig && this.bridge?.sendSignal) {
      this.bridge.sendSignal({ type: sig, price: c.c, time: c.t });
    }
  }

  updateProgress() {
    const p = ((this.currentIndex-this.startIndex)/(this.endIndex-this.startIndex))*100;
    document.getElementById('progressFill').style.width = p+'%';
    document.getElementById('currentTime').textContent = `${this.currentIndex-this.startIndex} / ${this.endIndex-this.startIndex}`;
  }
  updateLiveStats() {
    const pnl = this.portfolio.balance - this.portfolio.initialBalance;
    const winRate = this.portfolio.totals.total>0 ? (this.portfolio.totals.wins/this.portfolio.totals.total*100) : 0;
    document.getElementById('liveBalance').textContent = `$${this.portfolio.balance.toFixed(0)}`;
    const pnlEl = document.getElementById('livePnL');
    pnlEl.textContent = `${pnl>=0?'+':''}$${pnl.toFixed(0)}`;
    pnlEl.style.color = pnl>=0 ? '#00ff00' : '#ff4444';
    document.getElementById('liveTrades').textContent = this.portfolio.totals.total;
    document.getElementById('liveWinRate').textContent = `${winRate.toFixed(0)}%`;
  }

  onComplete() {
    this.state='completed';
    document.getElementById('playIcon').style.display='block';
    document.getElementById('pauseIcon').style.display='none';
    const s = summarize(this.portfolio);
    alert(`📊 Backtest Completo!\n\nRetorno: ${s.totalReturnPct>=0?'+':''}${s.totalReturnPct.toFixed(2)}%\nTrades: ${s.totalTrades}\nWin Rate: ${s.winRate.toFixed(1)}%\nMax Drawdown: -${s.maxDrawdown.toFixed(1)}%\nSharpe: ${s.sharpe.toFixed(2)}`);
  }

  // ===== Indicators =====
  precalcIndicators() {
    const closes = this.candles.slice(this.startIndex, this.endIndex).map(c=>c.c);
    this.indicators.sma20 = SMA(closes, 20);
    this.indicators.sma50 = SMA(closes, 50);
    this.indicators.bb    = Bollinger(closes, 20, 2);
    this.indicators.rsi   = RSI(closes, (this.engine?.algorithm?.params?.rsiPeriod)||14);
  }

  // ===== Render =====
  draw() {
    this.renderer.drawAll({
      candles: this.candles,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      currentIndex: this.currentIndex,
      indicators: this.indicators,
      trades: this.portfolio.trades,
      history: this.portfolio.history
    });
  }

  run() {
    this.reset();
    this.play();
  }

}