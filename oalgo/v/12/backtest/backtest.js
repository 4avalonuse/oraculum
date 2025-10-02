// C:\4Avalon\projetos\oraculum\oalgo\backtest\backtest.js
// v15.0 - Backtest com controles estilo YouTube player
export default class Backtest {
  constructor(engine, candles, canvas, bridge = null) {
    this.engine = engine;
    this.candles = candles;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.bridge = bridge;
    
    // Estado do backtest
    this.state = 'idle'; // idle, running, paused, completed
    this.currentIndex = 0;
    this.startIndex = 0;
    this.endIndex = Math.min(100, candles.length); // Default: primeiras 100 velas
    this.speed = 1; // Multiplicador de velocidade (0.25x, 0.5x, 1x, 2x, 4x)
    this.baseSpeed = 100; // ms base entre candles
    
    // Trading state
    this.position = null;
    this.entryPrice = null;
    this.entryTime = null;
    this.trades = [];
    
    // Performance
    this.balance = 10000;
    this.initialBalance = 10000;
    this.equity = 10000;
    this.maxEquity = 10000;
    this.maxDrawdown = 0;
    this.balanceHistory = [];
    
    // Statistics
    this.totalTrades = 0;
    this.winningTrades = 0;
    this.losingTrades = 0;
    this.grossProfit = 0;
    this.grossLoss = 0;
    this.returns = [];
    
    // Visual settings
    this.showIndicators = true;
    this.showVolume = true;
    this.showSignals = true;
    
    // Indicadores pré-calculados
    this.indicators = {};
    
    this.setupCanvas();
    this.createPlayerControls();
    this.precalculateIndicators();
  }
  
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  createPlayerControls() {
    // Remove controles antigos se existirem
    const oldControls = document.getElementById('backtestPlayer');
    if (oldControls) oldControls.remove();
    
    // Cria container do player
    const playerHTML = `
      <div id="backtestPlayer" style="
        margin-top: 10px;
        background: #1a1a1a;
        border-radius: 8px;
        padding: 12px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Progress Bar -->
        <div style="position: relative; margin-bottom: 12px;">
          <div id="progressBar" style="
            width: 100%;
            height: 4px;
            background: #404040;
            border-radius: 2px;
            cursor: pointer;
            position: relative;
          ">
            <div id="progressFill" style="
              width: 0%;
              height: 100%;
              background: #ff0000;
              border-radius: 2px;
              position: relative;
            ">
              <div style="
                position: absolute;
                right: -6px;
                top: -4px;
                width: 12px;
                height: 12px;
                background: #ff0000;
                border-radius: 50%;
                cursor: grab;
              "></div>
            </div>
          </div>
          <div style="
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
            font-size: 11px;
            color: #999;
          ">
            <span id="currentTime">0 / 100</span>
            <span id="totalTime">candles</span>
          </div>
        </div>
        
        <!-- Controls -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <!-- Play/Pause -->
          <button id="playPauseBtn" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            transition: background 0.2s;
          " onmouseover="this.style.background='#333'" onmouseout="this.style.background='none'">
            <svg id="playIcon" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg id="pauseIcon" width="24" height="24" viewBox="0 0 24 24" fill="white" style="display: none;">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>
          
          <!-- Reset -->
          <button id="resetBtn" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
          " onmouseover="this.style.background='#333'" onmouseout="this.style.background='none'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>
          
          <!-- Speed Control -->
          <div style="
            margin-left: 12px;
            padding: 4px 8px;
            background: #333;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            user-select: none;
            min-width: 45px;
            text-align: center;
          " id="speedControl">
            1x
          </div>
          
          <!-- Separator -->
          <div style="width: 1px; height: 24px; background: #404040; margin: 0 8px;"></div>
          
          <!-- Stats Display -->
          <div style="display: flex; gap: 16px; font-size: 12px; color: #ccc;">
            <div>
              <span style="color: #999;">Balance:</span>
              <span id="liveBalance" style="font-weight: 600;">$10,000</span>
            </div>
            <div>
              <span style="color: #999;">P&L:</span>
              <span id="livePnL" style="font-weight: 600; color: #999;">$0</span>
            </div>
            <div>
              <span style="color: #999;">Trades:</span>
              <span id="liveTrades" style="font-weight: 600;">0</span>
            </div>
            <div>
              <span style="color: #999;">Win Rate:</span>
              <span id="liveWinRate" style="font-weight: 600;">0%</span>
            </div>
          </div>
          
          <!-- Settings -->
          <button id="settingsBtn" style="
            margin-left: auto;
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            transition: all 0.2s;
          " onmouseover="this.style.color='white'; this.style.background='#333'" 
             onmouseout="this.style.color='#999'; this.style.background='none'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Settings Panel (hidden by default) -->
      <div id="settingsPanel" style="
        display: none;
        background: #2a2a2a;
        border-radius: 8px;
        padding: 16px;
        margin-top: 10px;
      ">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: white;">Configurações do Backtest</h3>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <!-- Start Date -->
          <div>
            <label style="display: block; font-size: 12px; color: #999; margin-bottom: 4px;">
              Início (Candle #)
            </label>
            <input type="number" id="startCandle" min="0" max="${this.candles.length}" value="0" style="
              width: 100%;
              padding: 6px;
              background: #1a1a1a;
              border: 1px solid #404040;
              border-radius: 4px;
              color: white;
              font-size: 12px;
            ">
          </div>
          
          <!-- Range -->
          <div>
            <label style="display: block; font-size: 12px; color: #999; margin-bottom: 4px;">
              Número de Velas
            </label>
            <input type="number" id="candleRange" min="10" max="${this.candles.length}" value="100" style="
              width: 100%;
              padding: 6px;
              background: #1a1a1a;
              border: 1px solid #404040;
              border-radius: 4px;
              color: white;
              font-size: 12px;
            ">
          </div>
        </div>
        
        <!-- Date Preview -->
        <div style="
          margin-top: 12px;
          padding: 8px;
          background: #1a1a1a;
          border-radius: 4px;
          font-size: 11px;
          color: #999;
        ">
          <div id="datePreview">Período: --</div>
        </div>
        
        <!-- Quick Presets -->
        <div style="margin-top: 12px;">
          <label style="display: block; font-size: 12px; color: #999; margin-bottom: 8px;">
            Períodos Rápidos
          </label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="presetBtn" data-range="30" style="
              padding: 4px 12px;
              background: #333;
              border: 1px solid #404040;
              border-radius: 4px;
              color: white;
              font-size: 11px;
              cursor: pointer;
            ">30 dias</button>
            <button class="presetBtn" data-range="90" style="
              padding: 4px 12px;
              background: #333;
              border: 1px solid #404040;
              border-radius: 4px;
              color: white;
              font-size: 11px;
              cursor: pointer;
            ">90 dias</button>
            <button class="presetBtn" data-range="180" style="
              padding: 4px 12px;
              background: #333;
              border: 1px solid #404040;
              border-radius: 4px;
              color: white;
              font-size: 11px;
              cursor: pointer;
            ">6 meses</button>
            <button class="presetBtn" data-range="365" style="
              padding: 4px 12px;
              background: #333;
              border: 1px solid #404040;
              border-radius: 4px;
              color: white;
              font-size: 11px;
              cursor: pointer;
            ">1 ano</button>
            <button class="presetBtn" data-range="all" style="
              padding: 4px 12px;
              background: #333;
              border: 1px solid #404040;
              border-radius: 4px;
              color: white;
              font-size: 11px;
              cursor: pointer;
            ">Tudo</button>
          </div>
        </div>
        
        <!-- Indicators Toggle -->
        <div style="margin-top: 12px;">
          <label style="display: block; font-size: 12px; color: #999; margin-bottom: 8px;">
            Indicadores
          </label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #ccc;">
              <input type="checkbox" id="showMA" checked> Médias Móveis
            </label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #ccc;">
              <input type="checkbox" id="showBB" checked> Bollinger
            </label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #ccc;">
              <input type="checkbox" id="showRSI" checked> RSI
            </label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #ccc;">
              <input type="checkbox" id="showVolume" checked> Volume
            </label>
            <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #ccc;">
              <input type="checkbox" id="showTrades" checked> Trades
            </label>
          </div>
        </div>
        
        <!-- Apply Button -->
        <button id="applySettings" style="
          width: 100%;
          margin-top: 16px;
          padding: 10px;
          background: #ff0000;
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='#cc0000'" onmouseout="this.style.background='#ff0000'">
          Aplicar Configurações
        </button>
      </div>
    `;
    
    // Insere após o canvas
    this.canvas.insertAdjacentHTML('afterend', playerHTML);
    
    // Attach event listeners
    this.attachPlayerEvents();
    this.updateDatePreview();
  }

  attachPlayerEvents() {
    // Play/Pause
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.onclick = () => this.togglePlayPause();
    
    // Reset
    document.getElementById('resetBtn').onclick = () => this.reset();
    
    // Speed control
    const speedControl = document.getElementById('speedControl');
    const speeds = [0.25, 0.5, 1, 2, 4];
    let currentSpeedIndex = 2; // Start at 1x
    
    speedControl.onclick = () => {
      currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
      this.speed = speeds[currentSpeedIndex];
      speedControl.textContent = this.speed + 'x';
    };
    
    // Progress bar
    const progressBar = document.getElementById('progressBar');
    progressBar.onclick = (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.seekTo(percent);
    };
    
    // Settings toggle
    document.getElementById('settingsBtn').onclick = () => {
      const panel = document.getElementById('settingsPanel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
    
    // Settings inputs
    document.getElementById('startCandle').oninput = () => this.updateDatePreview();
    document.getElementById('candleRange').oninput = () => this.updateDatePreview();
    
    // Apply settings
    document.getElementById('applySettings').onclick = () => this.applySettings();
    
    // Preset buttons
    document.querySelectorAll('.presetBtn').forEach(btn => {
      btn.onclick = () => {
        const range = btn.dataset.range;
        if (range === 'all') {
          document.getElementById('startCandle').value = 0;
          document.getElementById('candleRange').value = this.candles.length;
        } else {
          const numCandles = parseInt(range);
          document.getElementById('startCandle').value = Math.max(0, this.candles.length - numCandles);
          document.getElementById('candleRange').value = numCandles;
        }
        this.updateDatePreview();
      };
    });
    
    // Indicator toggles
    document.getElementById('showMA').onchange = (e) => {
      this.showIndicators = e.target.checked;
      this.draw();
    };
    document.getElementById('showVolume').onchange = (e) => {
      this.showVolume = e.target.checked;
      this.draw();
    };
    document.getElementById('showTrades').onchange = (e) => {
      this.showSignals = e.target.checked;
      this.draw();
    };
  }

  updateDatePreview() {
    const start = parseInt(document.getElementById('startCandle').value) || 0;
    const range = parseInt(document.getElementById('candleRange').value) || 100;
    const end = Math.min(start + range, this.candles.length);
    
    if (this.candles[start] && this.candles[end - 1]) {
      const startDate = new Date(this.candles[start].t * 1000).toLocaleDateString();
      const endDate = new Date(this.candles[end - 1].t * 1000).toLocaleDateString();
      document.getElementById('datePreview').textContent = `Período: ${startDate} até ${endDate} (${range} candles)`;
    }
  }

  applySettings() {
    const start = parseInt(document.getElementById('startCandle').value) || 0;
    const range = parseInt(document.getElementById('candleRange').value) || 100;
    
    this.startIndex = Math.max(0, Math.min(start, this.candles.length - 10));
    this.endIndex = Math.min(this.startIndex + range, this.candles.length);
    
    this.reset();
    this.precalculateIndicators();
    
    // Update display
    document.getElementById('currentTime').textContent = `0 / ${this.endIndex - this.startIndex}`;
    document.getElementById('totalTime').textContent = 'candles';
    
    // Close settings panel
    document.getElementById('settingsPanel').style.display = 'none';
    
    console.log(`📊 Período aplicado: ${this.startIndex} até ${this.endIndex}`);
  }

  togglePlayPause() {
    if (this.state === 'idle' || this.state === 'paused') {
      this.play();
    } else if (this.state === 'running') {
      this.pause();
    } else if (this.state === 'completed') {
      this.reset();
      this.play();
    }
  }

  play() {
    this.state = 'running';
    document.getElementById('playIcon').style.display = 'none';
    document.getElementById('pauseIcon').style.display = 'block';
    
    if (this.currentIndex === 0) {
      this.currentIndex = this.startIndex;
    }
    
    this.loop();
  }

  pause() {
    this.state = 'paused';
    document.getElementById('playIcon').style.display = 'block';
    document.getElementById('pauseIcon').style.display = 'none';
  }

  reset() {
    this.state = 'idle';
    this.currentIndex = this.startIndex;
    this.position = null;
    this.entryPrice = null;
    this.entryTime = null;
    this.trades = [];
    this.balance = this.initialBalance;
    this.equity = this.initialBalance;
    this.maxEquity = this.initialBalance;
    this.maxDrawdown = 0;
    this.balanceHistory = [{x: this.startIndex, y: this.initialBalance}];
    this.totalTrades = 0;
    this.winningTrades = 0;
    this.losingTrades = 0;
    this.grossProfit = 0;
    this.grossLoss = 0;
    this.returns = [];
    this.engine.reset();
    
    // Reset UI
    document.getElementById('playIcon').style.display = 'block';
    document.getElementById('pauseIcon').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('currentTime').textContent = `0 / ${this.endIndex - this.startIndex}`;
    
    this.updateLiveStats();
    this.draw();
  }

  seekTo(percent) {
    const targetIndex = this.startIndex + Math.floor((this.endIndex - this.startIndex) * percent);
    
    // Se estiver indo para frente, continua de onde está
    if (targetIndex > this.currentIndex) {
      // Continua processando até o target
      while (this.currentIndex < targetIndex && this.currentIndex < this.endIndex) {
        const candle = this.candles[this.currentIndex];
        this.processCandle(candle);
        this.currentIndex++;
      }
    } else {
      // Se voltar, precisa resetar e recalcular
      this.reset();
      while (this.currentIndex < targetIndex && this.currentIndex < this.endIndex) {
        const candle = this.candles[this.currentIndex];
        this.processCandle(candle);
        this.currentIndex++;
      }
    }
    
    this.updateProgress();
    this.draw();
  }

  loop() {
    if (this.state !== 'running' || this.currentIndex >= this.endIndex) {
      if (this.currentIndex >= this.endIndex) {
        this.onComplete();
      }
      return;
    }

    const candle = this.candles[this.currentIndex];
    this.processCandle(candle);
    
    this.currentIndex++;
    this.updateProgress();
    this.updateLiveStats();
    this.draw();
    
    // Next iteration with speed multiplier
    const delay = this.baseSpeed / this.speed;
    setTimeout(() => this.loop(), delay);
  }

  processCandle(candle) {
    // Context for engine
    const context = {
      price: candle.c,
      open: candle.o,
      high: candle.h,
      low: candle.l,
      volume: candle.v || 0,
      t: candle.t || this.currentIndex
    };
    
    // Run strategy
    this.engine.run(context);
    
    // Process signals
    this.processSignals(candle);
    
    // Update metrics
    this.updateMetrics(candle);
  }

  processSignals(candle) {
    const signal = this.engine.lastSignal;
    const params = this.engine.algorithm.params || {};
    const orderSize = params.orderSize || 1;
    const commission = params.commission || 0.001;
    const slippage = params.slippage || 0.0005;
    
    const buyPrice = candle.c * (1 + slippage);
    const sellPrice = candle.c * (1 - slippage);
    
    if (signal === "BUY" && !this.position) {
      this.position = "LONG";
      this.entryPrice = buyPrice;
      this.entryTime = this.currentIndex;
      
      const orderValue = buyPrice * orderSize;
      const commissionCost = orderValue * commission;
      this.balance -= (orderValue + commissionCost);
    }
    else if (signal === "SELL" && this.position === "LONG") {
      const exitPrice = sellPrice;
      const priceChange = (exitPrice - this.entryPrice) / this.entryPrice;
      const orderValue = exitPrice * orderSize;
      const commissionCost = orderValue * commission;
      const profit = (exitPrice - this.entryPrice) * orderSize - commissionCost * 2;
      
      this.balance += (orderValue - commissionCost);
      
      this.trades.push({
        entry: this.entryPrice,
        exit: exitPrice,
        entryTime: this.entryTime,
        exitTime: this.currentIndex,
        profit: profit,
        profitPct: priceChange * 100,
        type: profit > 0 ? "WIN" : "LOSS"
      });
      
      this.totalTrades++;
      
      if (profit > 0) {
        this.winningTrades++;
        this.grossProfit += profit;
      } else {
        this.losingTrades++;
        this.grossLoss += Math.abs(profit);
      }
      
      this.returns.push(priceChange);
      
      this.position = null;
      this.entryPrice = null;
      this.entryTime = null;
    }
  }

  updateMetrics(candle) {
    if (this.position === "LONG" && this.entryPrice) {
      const currentValue = candle.c * (this.engine.algorithm.params?.orderSize || 1);
      this.equity = this.balance + currentValue;
    } else {
      this.equity = this.balance;
    }
    
    if (this.equity > this.maxEquity) {
      this.maxEquity = this.equity;
    }
    
    const currentDrawdown = (this.maxEquity - this.equity) / this.maxEquity * 100;
    if (currentDrawdown > this.maxDrawdown) {
      this.maxDrawdown = currentDrawdown;
    }
    
    this.balanceHistory.push({
      x: this.currentIndex,
      y: this.equity,
      balance: this.balance
    });
  }

  updateProgress() {
    const progress = ((this.currentIndex - this.startIndex) / (this.endIndex - this.startIndex)) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentTime').textContent = 
      `${this.currentIndex - this.startIndex} / ${this.endIndex - this.startIndex}`;
  }

  updateLiveStats() {
    const pnl = this.balance - this.initialBalance;
    const winRate = this.totalTrades > 0 ? (this.winningTrades / this.totalTrades * 100) : 0;
    
    document.getElementById('liveBalance').textContent = `$${this.balance.toFixed(0)}`;
    
    const pnlElement = document.getElementById('livePnL');
    pnlElement.textContent = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)}`;
    pnlElement.style.color = pnl >= 0 ? '#00ff00' : '#ff4444';
    
    document.getElementById('liveTrades').textContent = this.totalTrades;
    document.getElementById('liveWinRate').textContent = `${winRate.toFixed(0)}%`;
  }

  precalculateIndicators() {
    const closes = this.candles.slice(this.startIndex, this.endIndex).map(c => c.c);
    
    // Calculate basic indicators
    this.indicators.sma20 = this.calculateSMA(closes, 20);
    this.indicators.sma50 = this.calculateSMA(closes, 50);
    this.indicators.bb = this.calculateBollinger(closes, 20, 2);
    this.indicators.rsi = this.calculateRSI(closes, 14);
  }

  calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  }

  calculateBollinger(data, period, stdDev) {
    const bb = [];
    const sma = this.calculateSMA(data, period);
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        bb.push({ upper: null, middle: null, lower: null });
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        const sd = Math.sqrt(variance);
        
        bb.push({
          upper: mean + (sd * stdDev),
          middle: mean,
          lower: mean - (sd * stdDev)
        });
      }
    }
    return bb;
  }

  calculateRSI(data, period) {
    const rsi = [];
    rsi.push(null);
    
    for (let i = 1; i < data.length; i++) {
      if (i < period) {
        rsi.push(null);
      } else {
        const gains = [];
        const losses = [];
        
        for (let j = i - period + 1; j <= i; j++) {
          const change = data[j] - data[j - 1];
          gains.push(change > 0 ? change : 0);
          losses.push(change < 0 ? -change : 0);
        }
        
        const avgGain = gains.reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }
    return rsi;
  }

  draw() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, w, h);
    
    // Layout simples: 70% preço, 30% equity
    const priceHeight = h * 0.7;
    const equityHeight = h * 0.3;
    
    this.drawPriceChart(0, 0, w, priceHeight);
    this.drawEquityChart(0, priceHeight, w, equityHeight);
  }

  drawPriceChart(x, y, width, height) {
    const ctx = this.ctx;
    const padding = 15;
    
    // Visible candles (últimas 100 ou menos)
    const windowSize = 100;
    const endIdx = Math.min(this.currentIndex + 1, this.endIndex);
    const startIdx = Math.max(this.startIndex, endIdx - windowSize);
    const visible = this.candles.slice(startIdx, endIdx);
    
    if (visible.length === 0) return;
    
    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, width, height);
    
    // Price range
    const prices = visible.flatMap(c => [c.o, c.h, c.l, c.c]);
    const minPrice = Math.min(...prices) * 0.998;
    const maxPrice = Math.max(...prices) * 1.002;
    const priceRange = maxPrice - minPrice || 1;
    
    const scaleY = (price) => {
      return y + padding + (1 - (price - minPrice) / priceRange) * (height - 2 * padding);
    };
    
    const candleWidth = (width - 2 * padding - 60) / windowSize;
    const scaleX = (index) => x + padding + (index - (startIdx - this.startIndex)) * candleWidth;
    
    // Grid lines
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange * i / 5);
      const py = scaleY(price);
      
      ctx.beginPath();
      ctx.moveTo(x + padding, py);
      ctx.lineTo(x + width - 60, py);
      ctx.stroke();
      
      // Price labels
      ctx.fillStyle = "#666";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(price.toFixed(2), x + width - 5, py + 3);
    }
    
    // Moving averages
    if (this.showIndicators && this.indicators.sma20) {
      // SMA 20
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      let started = false;
      for (let i = 0; i < visible.length; i++) {
        const globalIdx = startIdx + i - this.startIndex;
        if (globalIdx >= 0 && globalIdx < this.indicators.sma20.length) {
          const smaValue = this.indicators.sma20[globalIdx];
          if (smaValue !== null) {
            const px = x + padding + i * candleWidth + candleWidth / 2;
            const py = scaleY(smaValue);
            
            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
      }
      ctx.stroke();
      
      // SMA 50
      if (this.indicators.sma50) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        started = false;
        for (let i = 0; i < visible.length; i++) {
          const globalIdx = startIdx + i - this.startIndex;
          if (globalIdx >= 0 && globalIdx < this.indicators.sma50.length) {
            const smaValue = this.indicators.sma50[globalIdx];
            if (smaValue !== null) {
              const px = x + padding + i * candleWidth + candleWidth / 2;
              const py = scaleY(smaValue);
              
              if (!started) {
                ctx.moveTo(px, py);
                started = true;
              } else {
                ctx.lineTo(px, py);
              }
            }
          }
        }
        ctx.stroke();
      }
    }
    
    // Bollinger Bands
    if (this.showIndicators && this.indicators.bb) {
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      // Upper band
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visible.length; i++) {
        const globalIdx = startIdx + i - this.startIndex;
        if (globalIdx >= 0 && globalIdx < this.indicators.bb.length) {
          const bb = this.indicators.bb[globalIdx];
          if (bb && bb.upper !== null) {
            const px = x + padding + i * candleWidth + candleWidth / 2;
            const py = scaleY(bb.upper);
            
            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
      }
      ctx.stroke();
      
      // Lower band
      ctx.beginPath();
      started = false;
      for (let i = 0; i < visible.length; i++) {
        const globalIdx = startIdx + i - this.startIndex;
        if (globalIdx >= 0 && globalIdx < this.indicators.bb.length) {
          const bb = this.indicators.bb[globalIdx];
          if (bb && bb.lower !== null) {
            const px = x + padding + i * candleWidth + candleWidth / 2;
            const py = scaleY(bb.lower);
            
            if (!started) {
              ctx.moveTo(px, py);
              started = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw candles
    visible.forEach((candle, i) => {
      const cx = x + padding + i * candleWidth + candleWidth / 2;
      const openY = scaleY(candle.o);
      const closeY = scaleY(candle.c);
      const highY = scaleY(candle.h);
      const lowY = scaleY(candle.l);
      
      const bullish = candle.c >= candle.o;
      
      // Shadow
      ctx.strokeStyle = bullish ? "#10b981" : "#ef4444";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, highY);
      ctx.lineTo(cx, lowY);
      ctx.stroke();
      
      // Body
      const bodyWidth = Math.max(1, candleWidth * 0.7);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      const bodyY = Math.min(openY, closeY);
      
      ctx.fillStyle = bullish ? "#10b981" : "#ef4444";
      ctx.fillRect(cx - bodyWidth / 2, bodyY, bodyWidth, bodyHeight);
      
      // Highlight current candle
      if (i === visible.length - 1) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - bodyWidth / 2 - 2, bodyY - 2, bodyWidth + 4, bodyHeight + 4);
      }
    });
    
    // Draw trade signals
    if (this.showSignals) {
      this.trades.forEach(trade => {
        // Entry
        if (trade.entryTime >= startIdx && trade.entryTime < endIdx) {
          const i = trade.entryTime - startIdx;
          const cx = x + padding + i * candleWidth + candleWidth / 2;
          const cy = scaleY(trade.entry);
          
          // Buy arrow
          ctx.fillStyle = "#10b981";
          ctx.beginPath();
          ctx.moveTo(cx, cy + 10);
          ctx.lineTo(cx - 4, cy + 18);
          ctx.lineTo(cx + 4, cy + 18);
          ctx.closePath();
          ctx.fill();
        }
        
        // Exit
        if (trade.exitTime >= startIdx && trade.exitTime < endIdx) {
          const i = trade.exitTime - startIdx;
          const cx = x + padding + i * candleWidth + candleWidth / 2;
          const cy = scaleY(trade.exit);
          
          // Sell arrow
          ctx.fillStyle = trade.profit > 0 ? "#10b981" : "#ef4444";
          ctx.beginPath();
          ctx.moveTo(cx, cy - 10);
          ctx.lineTo(cx - 4, cy - 18);
          ctx.lineTo(cx + 4, cy - 18);
          ctx.closePath();
          ctx.fill();
          
          // Profit label
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`${trade.profitPct > 0 ? '+' : ''}${trade.profitPct.toFixed(1)}%`, cx, cy - 25);
        }
      });
    }
    
    // Title
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    const currentCandle = this.candles[Math.min(this.currentIndex, this.endIndex - 1)];
    if (currentCandle) {
      ctx.fillText(`${currentCandle.c.toFixed(2)}`, x + padding, y + 12);
      
      const change = ((currentCandle.c - currentCandle.o) / currentCandle.o * 100);
      ctx.fillStyle = change >= 0 ? "#10b981" : "#ef4444";
      ctx.font = "12px sans-serif";
      ctx.fillText(`${change >= 0 ? '+' : ''}${change.toFixed(2)}%`, x + padding + 80, y + 12);
    }
    
    // RSI indicator (text only)
    if (this.indicators.rsi) {
      const currentRSI = this.indicators.rsi[this.currentIndex - this.startIndex];
      if (currentRSI !== null) {
        ctx.fillStyle = currentRSI > 70 ? "#ef4444" : currentRSI < 30 ? "#10b981" : "#666";
        ctx.font = "11px monospace";
        ctx.fillText(`RSI: ${currentRSI.toFixed(1)}`, x + padding + 160, y + 12);
      }
    }
  }

  drawEquityChart(x, y, width, height) {
    const ctx = this.ctx;
    const history = this.balanceHistory;
    
    if (history.length < 2) return;
    
    const padding = 15;
    
    // Background
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(x, y, width, height);
    
    // Find min/max
    const equities = history.map(h => h.y);
    const minEquity = Math.min(...equities) * 0.995;
    const maxEquity = Math.max(...equities) * 1.005;
    const range = maxEquity - minEquity || 1;
    
    const scaleX = (i) => x + padding + (i / (history.length - 1)) * (width - 2 * padding - 60);
    const scaleY = (equity) => y + padding + (1 - (equity - minEquity) / range) * (height - 2 * padding);
    
    // Break-even line
    const breakEvenY = scaleY(this.initialBalance);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x + padding, breakEvenY);
    ctx.lineTo(x + width - 60, breakEvenY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Equity curve
    const isProfit = history[history.length - 1].y >= this.initialBalance;
    
    // Fill area
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    if (isProfit) {
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.1)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
    } else {
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.1)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0)");
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    history.forEach((point, i) => {
      const px = scaleX(i);
      const py = scaleY(point.y);
      
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineTo(scaleX(history.length - 1), y + height - padding);
    ctx.lineTo(scaleX(0), y + height - padding);
    ctx.closePath();
    ctx.fill();
    
    // Line
    ctx.strokeStyle = isProfit ? "#10b981" : "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((point, i) => {
      const px = scaleX(i);
      const py = scaleY(point.y);
      
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = "#666";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${maxEquity.toFixed(0)}`, x + width - 5, y + padding);
    ctx.fillText(`${this.initialBalance}`, x + width - 5, breakEvenY + 3);
    ctx.fillText(`${minEquity.toFixed(0)}`, x + width - 5, y + height - padding);
    
    // Title
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Equity", x + padding, y + 12);
    
    // Performance
    const currentReturn = ((this.equity - this.initialBalance) / this.initialBalance * 100);
    ctx.fillStyle = currentReturn >= 0 ? "#10b981" : "#ef4444";
    ctx.font = "11px monospace";
    ctx.fillText(`Return: ${currentReturn >= 0 ? '+' : ''}${currentReturn.toFixed(1)}%`, x + padding + 60, y + 12);
    
    if (this.maxDrawdown > 0) {
      ctx.fillStyle = "#ef4444";
      ctx.fillText(`DD: -${this.maxDrawdown.toFixed(1)}%`, x + padding + 170, y + 12);
    }
  }

  onComplete() {
    this.state = 'completed';
    document.getElementById('playIcon').style.display = 'block';
    document.getElementById('pauseIcon').style.display = 'none';
    
    console.log("✅ Backtest completo!");
    
    // Simple alert with results
    const totalReturn = ((this.balance - this.initialBalance) / this.initialBalance * 100);
    const winRate = this.totalTrades > 0 ? (this.winningTrades / this.totalTrades * 100) : 0;
    
    alert(`📊 Backtest Completo!\n\nRetorno: ${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%\nTrades: ${this.totalTrades}\nWin Rate: ${winRate.toFixed(1)}%\nMax Drawdown: -${this.maxDrawdown.toFixed(1)}%`);
  }

  // Public methods
  run() {
    this.reset();
    this.play();
  }

  setSpeed(multiplier) {
    this.speed = multiplier;
    document.getElementById('speedControl').textContent = multiplier + 'x';
  }

  setRange(start, numCandles) {
    document.getElementById('startCandle').value = start;
    document.getElementById('candleRange').value = numCandles;
    this.applySettings();
  }