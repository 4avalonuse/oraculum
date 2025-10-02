// C:\4Avalon\projetos\oraculum\oalgo\core\strategy-schema.js
// v13.0 — Validação completa de estratégias com suporte a condições avançadas

// Lista de condições válidas
const VALID_CONDITIONS = [
  // Preço simples
  "price > 100",
  "price < 80",
  "price > 120",
  "price < 120",
  
  // Médias móveis
  "crossover_up_SMA20",
  "crossover_down_SMA20",
  "price > sma20",
  "price < sma20",
  "price > sma50",
  "price < sma50",
  "golden_cross",
  "death_cross",
  
  // RSI
  "rsi < 30",
  "rsi > 70",
  "rsi < 35",
  "rsi > 65",
  "rsi < 40",
  "rsi > 60",
  "rsi < 45",
  "rsi > 55",
  "rsi < 50",
  "rsi > 50",
  "rsi > 75",
  "rsi > 80",
  
  // MACD
  "macd_bullish",
  "macd_bearish",
  
  // Bollinger Bands
  "price < bb_lower",
  "price > bb_upper",
  "price < bb_middle",
  "price > bb_middle",
  
  // Volume
  "high_volume",
  "low_volume",
  
  // Tendência
  "uptrend",
  "downtrend",
  "sideways"
];

// Ações válidas
const VALID_ACTIONS = [
  "BUY",
  "SELL",
  "HOLD",
  "CLOSE",
  "CLOSE_LONG",
  "CLOSE_SHORT"
];

// Parâmetros válidos
const VALID_PARAMS = [
  "orderSize",
  "commission",
  "slippage",
  "rsiPeriod",
  "smaPeriod",
  "emaPeriod",
  "bbPeriod",
  "bbStdDev",
  "fastPeriod",
  "slowPeriod",
  "signalPeriod",
  "oversoldLevel",
  "overboughtLevel",
  "supportLevel",
  "resistanceLevel",
  "targetProfit",
  "stopLoss",
  "holdingPeriod",
  "riskLevel",
  "dcaInterval",
  "volumeMultiplier",
  "fastMA",
  "slowMA",
  "trendPeriod",
  "fib382",
  "fib618"
];

export function makeDefaultStrategy() {
  return {
    name: "Default Strategy",
    description: "Estratégia padrão com RSI",
    version: "13.0",
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
        description: "Compra em oversold"
      },
      { 
        if: "rsi > 70", 
        then: "SELL",
        description: "Vende em overbought"
      }
    ],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: "OAlgo System",
      tags: ["RSI", "momentum"]
    }
  };
}

export function validateStrategy(json) {
  const errors = [];
  const warnings = [];
  
  // Validação básica de estrutura
  if (!json || typeof json !== "object") {
    errors.push("Strategy must be an object.");
    return { ok: false, errors, warnings };
  }
  
  // Validação do nome (opcional mas recomendado)
  if (!json.name) {
    warnings.push("Strategy should have a 'name' field.");
  } else if (typeof json.name !== "string") {
    errors.push("'name' must be a string.");
  }
  
  // Validação de parâmetros
  if (json.params) {
    if (typeof json.params !== "object") {
      errors.push("'params' must be an object.");
    } else {
      validateParams(json.params, errors, warnings);
    }
  }
  
  // Validação de steps (obrigatório)
  if (!Array.isArray(json.steps)) {
    errors.push("Missing 'steps' array.");
  } else if (json.steps.length === 0) {
    errors.push("'steps' array cannot be empty.");
  } else {
    json.steps.forEach((step, index) => {
      validateStep(step, index, errors, warnings);
    });
  }
  
  // Validação de metadata (opcional)
  if (json.metadata) {
    validateMetadata(json.metadata, warnings);
  }
  
  return { 
    ok: errors.length === 0, 
    errors, 
    warnings,
    valid: errors.length === 0
  };
}

function validateParams(params, errors, warnings) {
  Object.keys(params).forEach(key => {
    if (!VALID_PARAMS.includes(key)) {
      warnings.push(`Unknown parameter '${key}' - will be ignored.`);
    }
  });
  
  // Validações específicas de valores
  if (params.orderSize !== undefined) {
    if (typeof params.orderSize !== "number" || params.orderSize <= 0) {
      errors.push("'orderSize' must be a positive number.");
    }
  }
  
  if (params.commission !== undefined) {
    if (typeof params.commission !== "number" || params.commission < 0) {
      errors.push("'commission' must be a non-negative number.");
    }
  }
  
  if (params.slippage !== undefined) {
    if (typeof params.slippage !== "number" || params.slippage < 0) {
      errors.push("'slippage' must be a non-negative number.");
    }
  }
  
  if (params.rsiPeriod !== undefined) {
    if (!Number.isInteger(params.rsiPeriod) || params.rsiPeriod < 2 || params.rsiPeriod > 100) {
      errors.push("'rsiPeriod' must be an integer between 2 and 100.");
    }
  }
  
  if (params.targetProfit !== undefined && params.stopLoss !== undefined) {
    if (params.stopLoss >= params.targetProfit) {
      warnings.push("'stopLoss' should be smaller than 'targetProfit'.");
    }
  }
}

function validateStep(step, index, errors, warnings) {
  if (!step || typeof step !== "object") {
    errors.push(`Step[${index}] must be an object.`);
    return;
  }
  
  // Validação do 'if'
  if (!step.if) {
    errors.push(`Step[${index}] missing 'if' condition.`);
  } else {
    validateCondition(step.if, index, errors, warnings);
  }
  
  // Validação do 'then'
  if (!step.then) {
    errors.push(`Step[${index}] missing 'then' action.`);
  } else if (!VALID_ACTIONS.includes(step.then)) {
    errors.push(`Step[${index}] has invalid action '${step.then}'. Valid actions: ${VALID_ACTIONS.join(", ")}`);
  }
  
  // Validação de campos opcionais
  if (step.description && typeof step.description !== "string") {
    warnings.push(`Step[${index}] 'description' should be a string.`);
  }
  
  if (step.orderSizeMultiplier !== undefined) {
    if (typeof step.orderSizeMultiplier !== "number" || step.orderSizeMultiplier <= 0) {
      errors.push(`Step[${index}] 'orderSizeMultiplier' must be a positive number.`);
    }
  }
}

function validateCondition(condition, stepIndex, errors, warnings) {
  // Condição simples (string)
  if (typeof condition === "string") {
    if (!VALID_CONDITIONS.includes(condition)) {
      // Verifica se é uma condição de preço customizada
      if (!isValidPriceCondition(condition)) {
        warnings.push(`Step[${stepIndex}] uses unknown condition '${condition}' - may not work as expected.`);
      }
    }
    return;
  }
  
  // Condição complexa (objeto)
  if (typeof condition === "object") {
    const hasAnd = condition.hasOwnProperty("and");
    const hasOr = condition.hasOwnProperty("or");
    
    if (!hasAnd && !hasOr) {
      errors.push(`Step[${stepIndex}] complex condition must have 'and' or 'or' operator.`);
      return;
    }
    
    if (hasAnd && hasOr) {
      errors.push(`Step[${stepIndex}] cannot have both 'and' and 'or' in the same condition.`);
      return;
    }
    
    const conditions = hasAnd ? condition.and : condition.or;
    
    if (!Array.isArray(conditions)) {
      errors.push(`Step[${stepIndex}] '${hasAnd ? "and" : "or"}' must be an array of conditions.`);
      return;
    }
    
    if (conditions.length === 0) {
      errors.push(`Step[${stepIndex}] condition array cannot be empty.`);
      return;
    }
    
    conditions.forEach((subCondition, subIndex) => {
      if (typeof subCondition !== "string") {
        errors.push(`Step[${stepIndex}] condition[${subIndex}] must be a string.`);
      } else if (!VALID_CONDITIONS.includes(subCondition) && !isValidPriceCondition(subCondition)) {
        warnings.push(`Step[${stepIndex}] uses unknown sub-condition '${subCondition}'.`);
      }
    });
    
    return;
  }
  
  errors.push(`Step[${stepIndex}] 'if' must be a string or object with 'and'/'or' operator.`);
}

function isValidPriceCondition(condition) {
  // Permite condições de preço customizadas como "price > 150" ou "price < 50"
  const pricePattern = /^price\s*[<>]=?\s*\d+(\.\d+)?$/;
  return pricePattern.test(condition);
}

function validateMetadata(metadata, warnings) {
  if (metadata.created && !isValidDate(metadata.created)) {
    warnings.push("'metadata.created' should be a valid ISO date string.");
  }
  
  if (metadata.modified && !isValidDate(metadata.modified)) {
    warnings.push("'metadata.modified' should be a valid ISO date string.");
  }
  
  if (metadata.tags && !Array.isArray(metadata.tags)) {
    warnings.push("'metadata.tags' should be an array of strings.");
  }
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Função para migrar estratégias antigas para o novo formato
export function migrateStrategy(oldStrategy) {
  const migrated = { ...oldStrategy };
  
  // Adiciona campos faltantes
  if (!migrated.name) {
    migrated.name = "Migrated Strategy";
  }
  
  if (!migrated.version) {
    migrated.version = "13.0";
  }
  
  if (!migrated.params) {
    migrated.params = {
      orderSize: 1,
      commission: 0,
      slippage: 0
    };
  }
  
  // Converte steps antigos se necessário
  if (migrated.steps) {
    migrated.steps = migrated.steps.map(step => {
      // Adiciona descrição se não existir
      if (!step.description) {
        step.description = `${step.then} when ${step.if}`;
      }
      return step;
    });
  }
  
  // Adiciona metadata
  if (!migrated.metadata) {
    migrated.metadata = {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      migrated: true
    };
  }
  
  return migrated;
}

// Função para sugerir melhorias em uma estratégia
export function suggestImprovements(strategy) {
  const suggestions = [];
  const analysis = analyzeStrategy(strategy);
  
  if (!analysis.hasRiskManagement) {
    suggestions.push("Consider adding stop-loss or take-profit parameters for risk management.");
  }
  
  if (analysis.singleIndicator) {
    suggestions.push("Consider combining multiple indicators for more reliable signals.");
  }
  
  if (!analysis.hasVolumeFilter) {
    suggestions.push("Adding volume confirmation can improve signal quality.");
  }
  
  if (analysis.steps.length < 2) {
    suggestions.push("Add both entry and exit conditions for complete strategy.");
  }
  
  if (!strategy.params.commission || strategy.params.commission === 0) {
    suggestions.push("Set realistic commission values for accurate backtesting.");
  }
  
  return suggestions;
}

function analyzeStrategy(strategy) {
  const analysis = {
    hasRiskManagement: false,
    singleIndicator: true,
    hasVolumeFilter: false,
    steps: strategy.steps || [],
    indicators: new Set()
  };
  
  // Analisa parâmetros
  if (strategy.params) {
    if (strategy.params.stopLoss || strategy.params.targetProfit) {
      analysis.hasRiskManagement = true;
    }
  }
  
  // Analisa steps
  strategy.steps?.forEach(step => {
    const conditionStr = JSON.stringify(step.if);
    
    // Detecta indicadores usados
    if (conditionStr.includes("rsi")) analysis.indicators.add("RSI");
    if (conditionStr.includes("sma")) analysis.indicators.add("SMA");
    if (conditionStr.includes("ema")) analysis.indicators.add("EMA");
    if (conditionStr.includes("macd")) analysis.indicators.add("MACD");
    if (conditionStr.includes("bb_")) analysis.indicators.add("BB");
    if (conditionStr.includes("volume")) analysis.hasVolumeFilter = true;
  });
  
  analysis.singleIndicator = analysis.indicators.size <= 1;
  
  return analysis;
}