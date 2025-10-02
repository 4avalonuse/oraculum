// C:\4Avalon\projetos\oraculum\oalgo\core\OAlgoEngine.js
// v13.0 – Engine com indicadores técnicos reais e condições avançadas
import { validateStrategy, makeDefaultStrategy } from "./strategy-schema.js";
import { Sync } from "./sync.js";

export default class OAlgoEngine {
  constructor() {
    const saved = Sync.loadStrategy();
    this.algorithm = saved || makeDefaultStrategy();
    this.bridge = null;
    this.lastSignal = null;
    this.indicators = {};
    this.history = [];
    this.maxHistory = 200; // Mantém histórico para cálculos
  }

  setBridge(bridge) { 
    this.bridge = bridge; 
  }

  setAlgorithm(json) {
    const { ok } = validateStrategy(json);
    if (!ok) throw new Error("Invalid strategy JSON");
    this.algorithm = json;
    Sync.saveStrategy(json);
  }

  load(json) {
    this.setAlgorithm(json);
    console.log("✅ Algorithm loaded:", this.algorithm);
    this.resetIndicators();
  }

  addStep(step) {
    if (!this.algorithm.steps) this.algorithm.steps = [];
    this.algorithm.steps.push(step);
    Sync.saveStrategy(this.algorithm);
  }

  getJSON() { 
    return JSON.stringify(this.algorithm, null, 2); 
  }

  resetIndicators() {
    this.indicators = {};
    this.history = [];
    this.lastSignal = null;
  }

  // Calcula SMA (Simple Moving Average)
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  // Calcula EMA (Exponential Moving Average)
  calculateEMA(prices, period) {
    if (prices.length < period) return null;
    
    const k = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  // Calcula RSI (Relative Strength Index)
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Calcula MACD
  calculateMACD(prices) {
    if (prices.length < 26) return null;
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (!ema12 || !ema26) return null;
    
    const macdLine = ema12 - ema26;
    const signal = this.indicators.macdSignal || macdLine;
    
    // Atualiza signal com EMA de 9 períodos
    const k = 2 / 10;
    this.indicators.macdSignal = signal * (1 - k) + macdLine * k;
    
    return {
      macd: macdLine,
      signal: this.indicators.macdSignal,
      histogram: macdLine - this.indicators.macdSignal
    };
  }

  // Calcula Bollinger Bands
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return null;
    
    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;
    
    const slice = prices.slice(-period);
    const variance = slice.reduce((sum, price) => {
      const diff = price - sma;
      return sum + diff * diff;
    }, 0) / period;
    
    const sd = Math.sqrt(variance);
    
    return {
      upper: sma + (sd * stdDev),
      middle: sma,
      lower: sma - (sd * stdDev)
    };
  }

  // Atualiza indicadores com novo preço
  updateIndicators(context) {
    const prices = this.history.map(h => h.price);
    
    if (prices.length >= 20) {
      this.indicators.sma20 = this.calculateSMA(prices, 20);
      this.indicators.sma50 = this.calculateSMA(prices, 50);
      this.indicators.ema12 = this.calculateEMA(prices, 12);
      this.indicators.ema26 = this.calculateEMA(prices, 26);
    }
    
    if (prices.length >= 14) {
      this.indicators.rsi = this.calculateRSI(prices, 14);
    }
    
    if (prices.length >= 26) {
      this.indicators.macd = this.calculateMACD(prices);
    }
    
    if (prices.length >= 20) {
      this.indicators.bb = this.calculateBollingerBands(prices, 20, 2);
    }
    
    // Detecta crossovers
    if (this.history.length >= 2 && this.indicators.sma20) {
      const prevPrice = this.history[this.history.length - 2].price;
      const currPrice = context.price;
      const prevSMA = this.history[this.history.length - 2].sma20;
      const currSMA = this.indicators.sma20;
      
      if (prevSMA && currSMA) {
        context._crossoverUpSMA20 = prevPrice <= prevSMA && currPrice > currSMA;
        context._crossoverDownSMA20 = prevPrice >= prevSMA && currPrice < currSMA;
      }
    }
    
    // Salva SMA20 no histórico para próximo crossover
    context.sma20 = this.indicators.sma20;
  }

  // Avalia condições
  evaluateCondition(condition, context) {
    // Condições simples de preço
    if (condition === "price > 100") return context.price > 100;
    if (condition === "price < 80") return context.price < 80;
    
    // Crossovers de média móvel
    if (condition === "crossover_up_SMA20") return context._crossoverUpSMA20;
    if (condition === "crossover_down_SMA20") return context._crossoverDownSMA20;
    
    // RSI
    if (condition === "rsi < 30" && this.indicators.rsi) {
      return this.indicators.rsi < 30;
    }
    if (condition === "rsi > 70" && this.indicators.rsi) {
      return this.indicators.rsi > 70;
    }
    
    // MACD
    if (condition === "macd_bullish" && this.indicators.macd) {
      return this.indicators.macd.histogram > 0;
    }
    if (condition === "macd_bearish" && this.indicators.macd) {
      return this.indicators.macd.histogram < 0;
    }
    
    // Bollinger Bands
    if (condition === "price < bb_lower" && this.indicators.bb) {
      return context.price < this.indicators.bb.lower;
    }
    if (condition === "price > bb_upper" && this.indicators.bb) {
      return context.price > this.indicators.bb.upper;
    }
    
    // Médias móveis
    if (condition === "price > sma20" && this.indicators.sma20) {
      return context.price > this.indicators.sma20;
    }
    if (condition === "price < sma20" && this.indicators.sma20) {
      return context.price < this.indicators.sma20;
    }
    
    // Golden Cross / Death Cross
    if (condition === "golden_cross" && this.indicators.sma20 && this.indicators.sma50) {
      const prev20 = this.history[this.history.length - 2]?.sma20;
      const prev50 = this.history[this.history.length - 2]?.sma50;
      if (prev20 && prev50) {
        return prev20 <= prev50 && this.indicators.sma20 > this.indicators.sma50;
      }
    }
    if (condition === "death_cross" && this.indicators.sma20 && this.indicators.sma50) {
      const prev20 = this.history[this.history.length - 2]?.sma20;
      const prev50 = this.history[this.history.length - 2]?.sma50;
      if (prev20 && prev50) {
        return prev20 >= prev50 && this.indicators.sma20 < this.indicators.sma50;
      }
    }
    
    // Volume (se disponível)
    if (condition === "high_volume" && context.volume) {
      const avgVolume = this.history.slice(-20).reduce((sum, h) => sum + (h.volume || 0), 0) / 20;
      return context.volume > avgVolume * 1.5;
    }
    
    // Tendência
    if (condition === "uptrend" && this.indicators.sma20) {
      const sma5ago = this.history[this.history.length - 5]?.sma20;
      return sma5ago && this.indicators.sma20 > sma5ago;
    }
    if (condition === "downtrend" && this.indicators.sma20) {
      const sma5ago = this.history[this.history.length - 5]?.sma20;
      return sma5ago && this.indicators.sma20 < sma5ago;
    }
    
    return false;
  }

  // Processa múltiplas condições com operadores AND/OR
  evaluateComplexCondition(step, context) {
    if (typeof step.if === "string") {
      return this.evaluateCondition(step.if, context);
    }
    
    if (typeof step.if === "object") {
      if (step.if.and) {
        // Todas as condições devem ser verdadeiras
        return step.if.and.every(cond => this.evaluateCondition(cond, context));
      }
      if (step.if.or) {
        // Pelo menos uma condição deve ser verdadeira
        return step.if.or.some(cond => this.evaluateCondition(cond, context));
      }
    }
    
    return false;
  }

  run(context = {}) {
    // Adiciona ao histórico
    this.history.push({
      price: context.price,
      volume: context.volume || 0,
      time: context.t,
      sma20: this.indicators.sma20,
      sma50: this.indicators.sma50
    });
    
    // Limita o tamanho do histórico
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // Atualiza indicadores
    this.updateIndicators(context);
    
    // Processa estratégia
    const steps = Array.isArray(this.algorithm?.steps) ? this.algorithm.steps : [];
    
    for (const step of steps) {
      const conditionMet = this.evaluateComplexCondition(step, context);
      
      if (conditionMet) {
        const action = step.then;
        
        // Evita sinais repetidos
        if (action !== this.lastSignal) {
          this.lastSignal = action;
          
          // Envia sinal com informações adicionais
          this.bridge?.sendSignal({
            type: action,
            price: context.price,
            time: context.t,
            reason: step.if,
            indicators: {
              sma20: this.indicators.sma20,
              rsi: this.indicators.rsi,
              macd: this.indicators.macd
            }
          });
          
          console.log(`📊 Signal: ${action} at ${context.price.toFixed(2)}`, {
            condition: step.if,
            rsi: this.indicators.rsi?.toFixed(2),
            sma20: this.indicators.sma20?.toFixed(2)
          });
        }
      }
    }
  }
  
  // Retorna estado atual dos indicadores (útil para debug)
  getIndicators() {
    return { ...this.indicators };
  }
  
  // Limpa histórico e reinicia engine
  reset() {
    this.history = [];
    this.indicators = {};
    this.lastSignal = null;
    console.log("🔄 Engine reset");
  }
}