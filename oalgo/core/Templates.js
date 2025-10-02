// C:\4Avalon\projetos\oraculum\oalgo\core\Templates.js
// v13.0 — Templates com estratégias reais de trading
export const Templates = {
  "RSI Oversold/Overbought": {
    name: "RSI Oversold/Overbought",
    description: "Compra quando RSI < 30 (oversold) e vende quando RSI > 70 (overbought)",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      rsiPeriod: 14,
      oversoldLevel: 30,
      overboughtLevel: 70
    },
    steps: [
      { 
        if: "rsi < 30", 
        then: "BUY",
        description: "Compra quando RSI indica sobrevenda"
      },
      { 
        if: "rsi > 70", 
        then: "SELL",
        description: "Vende quando RSI indica sobrecompra"
      }
    ]
  },

  "MACD Signal Cross": {
    name: "MACD Signal Cross",
    description: "Opera baseado nos cruzamentos do MACD com sua linha de sinal",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    },
    steps: [
      { 
        if: "macd_bullish", 
        then: "BUY",
        description: "Compra quando MACD cruza acima da linha de sinal"
      },
      { 
        if: "macd_bearish", 
        then: "SELL",
        description: "Vende quando MACD cruza abaixo da linha de sinal"
      }
    ]
  },

  "Bollinger Bands Bounce": {
    name: "Bollinger Bands Bounce",
    description: "Compra na banda inferior e vende na banda superior",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      bbPeriod: 20,
      bbStdDev: 2
    },
    steps: [
      { 
        if: "price < bb_lower", 
        then: "BUY",
        description: "Compra quando preço toca banda inferior"
      },
      { 
        if: "price > bb_upper", 
        then: "SELL",
        description: "Vende quando preço toca banda superior"
      }
    ]
  },

  "RSI + Bollinger Combo": {
    name: "RSI + Bollinger Combo",
    description: "Combina RSI com Bollinger Bands para sinais mais confiáveis",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      rsiPeriod: 14,
      bbPeriod: 20
    },
    steps: [
      { 
        if: {
          and: ["rsi < 30", "price < bb_lower"]
        },
        then: "BUY",
        description: "Compra quando RSI oversold E preço abaixo da banda inferior"
      },
      { 
        if: {
          and: ["rsi > 70", "price > bb_upper"]
        },
        then: "SELL",
        description: "Vende quando RSI overbought E preço acima da banda superior"
      }
    ]
  },

  "SMA20 Crossover": {
    name: "SMA20 Crossover",
    description: "Clássica estratégia de cruzamento de média móvel",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      smaPeriod: 20
    },
    steps: [
      { 
        if: "crossover_up_SMA20", 
        then: "BUY",
        description: "Compra quando preço cruza acima da SMA20"
      },
      { 
        if: "crossover_down_SMA20", 
        then: "SELL",
        description: "Vende quando preço cruza abaixo da SMA20"
      }
    ]
  },

  "Golden/Death Cross": {
    name: "Golden/Death Cross",
    description: "Opera com cruzamentos das médias de 20 e 50 períodos",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      fastMA: 20,
      slowMA: 50
    },
    steps: [
      { 
        if: "golden_cross", 
        then: "BUY",
        description: "Golden Cross - SMA20 cruza acima da SMA50"
      },
      { 
        if: "death_cross", 
        then: "SELL",
        description: "Death Cross - SMA20 cruza abaixo da SMA50"
      }
    ]
  },

  "Trend Following": {
    name: "Trend Following",
    description: "Segue a tendência usando SMA e confirmação de momentum",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      trendPeriod: 20
    },
    steps: [
      { 
        if: {
          and: ["price > sma20", "uptrend", "rsi > 50"]
        },
        then: "BUY",
        description: "Compra em tendência de alta confirmada"
      },
      { 
        if: {
          and: ["price < sma20", "downtrend", "rsi < 50"]
        },
        then: "SELL",
        description: "Vende em tendência de baixa confirmada"
      }
    ]
  },

  "Volume Breakout": {
    name: "Volume Breakout",
    description: "Opera rompimentos com alto volume",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      volumeMultiplier: 1.5
    },
    steps: [
      { 
        if: {
          and: ["high_volume", "price > sma20", "rsi > 50"]
        },
        then: "BUY",
        description: "Compra em rompimento com volume alto"
      },
      { 
        if: {
          and: ["high_volume", "price < sma20", "rsi < 50"]
        },
        then: "SELL",
        description: "Vende em rompimento para baixo com volume"
      }
    ]
  },

  "Mean Reversion": {
    name: "Mean Reversion",
    description: "Aposta na reversão à média quando o preço se afasta muito",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      bbPeriod: 20,
      rsiPeriod: 14
    },
    steps: [
      { 
        if: {
          and: ["price < bb_lower", "rsi < 35", "uptrend"]
        },
        then: "BUY",
        description: "Compra oversold em tendência de alta"
      },
      { 
        if: {
          and: ["price > bb_upper", "rsi > 65", "downtrend"]
        },
        then: "SELL",
        description: "Vende overbought em tendência de baixa"
      }
    ]
  },

  "Scalping Strategy": {
    name: "Scalping Strategy",
    description: "Estratégia rápida para pequenos ganhos",
    params: { 
      orderSize: 2, 
      commission: 0.0005, 
      slippage: 0.0002,
      targetProfit: 0.005,
      stopLoss: 0.003
    },
    steps: [
      { 
        if: {
          and: ["rsi < 40", "price < sma20"]
        },
        then: "BUY",
        description: "Entrada rápida em oversold"
      },
      { 
        if: {
          or: ["rsi > 60", "price > sma20"]
        },
        then: "SELL",
        description: "Saída rápida com pequeno lucro"
      }
    ]
  },

  "Conservative Long-Term": {
    name: "Conservative Long-Term",
    description: "Estratégia conservadora para investimento de longo prazo",
    params: { 
      orderSize: 0.5, 
      commission: 0.001, 
      slippage: 0.001,
      holdingPeriod: "long"
    },
    steps: [
      { 
        if: {
          and: ["golden_cross", "rsi < 60", "uptrend"]
        },
        then: "BUY",
        description: "Compra apenas em condições muito favoráveis"
      },
      { 
        if: {
          or: ["death_cross", "rsi > 80"]
        },
        then: "SELL",
        description: "Vende em sinais de reversão forte"
      }
    ]
  },

  "Aggressive Day Trading": {
    name: "Aggressive Day Trading",
    description: "Estratégia agressiva para day trading",
    params: { 
      orderSize: 3, 
      commission: 0.0005, 
      slippage: 0.0003,
      riskLevel: "high"
    },
    steps: [
      { 
        if: {
          and: ["macd_bullish", "rsi > 40", "high_volume"]
        },
        then: "BUY",
        description: "Entrada agressiva em momentum"
      },
      { 
        if: {
          or: ["macd_bearish", "rsi > 70", "price > bb_upper"]
        },
        then: "SELL",
        description: "Saída em qualquer sinal negativo"
      }
    ]
  },

  "Price Bands": {
    name: "Price Bands",
    description: "Opera com bandas de preço fixas (suporte/resistência)",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      supportLevel: 80,
      resistanceLevel: 120
    },
    steps: [
      { 
        if: "price < 80", 
        then: "BUY",
        description: "Compra no suporte"
      },
      { 
        if: "price > 120", 
        then: "SELL",
        description: "Vende na resistência"
      }
    ]
  },

  "Smart DCA": {
    name: "Smart DCA (Dollar Cost Averaging)",
    description: "DCA inteligente que compra mais em oversold",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      dcaInterval: "weekly"
    },
    steps: [
      { 
        if: "rsi < 40", 
        then: "BUY",
        description: "Aumenta posição em oversold",
        orderSizeMultiplier: 2
      },
      { 
        if: {
          and: ["rsi > 75", "price > bb_upper"]
        },
        then: "SELL",
        description: "Realiza lucros parciais no topo",
        orderSizeMultiplier: 0.5
      }
    ]
  },

  "Fibonacci Retracement": {
    name: "Fibonacci Retracement",
    description: "Opera nos níveis de retração de Fibonacci",
    params: { 
      orderSize: 1, 
      commission: 0.001, 
      slippage: 0.0005,
      fib382: 0.382,
      fib618: 0.618
    },
    steps: [
      { 
        if: {
          and: ["rsi < 45", "price < sma20", "uptrend"]
        },
        then: "BUY",
        description: "Compra na retração em tendência de alta"
      },
      { 
        if: {
          and: ["rsi > 55", "price > sma20", "downtrend"]
        },
        then: "SELL",
        description: "Vende no pullback em tendência de baixa"
      }
    ]
  }
};

// Função auxiliar para obter template por nome
export function getTemplate(name) {
  return Templates[name] || null;
}

// Função para listar todos os templates disponíveis
export function listTemplates() {
  return Object.keys(Templates).map(key => ({
    name: key,
    description: Templates[key].description,
    riskLevel: Templates[key].params.riskLevel || "medium",
    complexity: getComplexity(Templates[key])
  }));
}

// Função para determinar complexidade da estratégia
function getComplexity(template) {
  const steps = template.steps || [];
  let complexity = "simple";
  
  for (const step of steps) {
    if (typeof step.if === "object") {
      complexity = "advanced";
      break;
    }
  }
  
  if (steps.length > 3) complexity = "intermediate";
  
  return complexity;
}

// Função para validar se um template é válido
export function validateTemplate(template) {
  if (!template.name || !template.steps || !Array.isArray(template.steps)) {
    return { valid: false, error: "Template inválido: falta nome ou steps" };
  }
  
  if (template.steps.length === 0) {
    return { valid: false, error: "Template deve ter pelo menos um step" };
  }
  
  for (const step of template.steps) {
    if (!step.if || !step.then) {
      return { valid: false, error: "Cada step deve ter 'if' e 'then'" };
    }
  }
  
  return { valid: true };
}