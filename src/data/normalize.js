function number(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Candle inválido: ${name}`);
  return n;
}

function timestamp(value) {
  let t = number(value, 'timestamp');

  // A Data API pode entregar Unix time em segundos ou milissegundos.
  // O contrato interno do ORACULUM é sempre milissegundos.
  if (Math.abs(t) < 1e12) t *= 1000;

  const date = new Date(t);
  if (!Number.isFinite(date.getTime())) {
    throw new Error('Candle inválido: timestamp');
  }

  return t;
}

function repairIsolatedScaleAnomalies(candles) {
  if (candles.length < 3) return candles;

  const closes = candles.map(c => c.close);
  const outliers = new Set();
  const ratio = (a, b) => {
    if (!(a > 0) || !(b > 0)) return Infinity;
    return Math.max(a, b) / Math.min(a, b);
  };

  // Detect a single candle whose price scale is wildly different from the
  // surrounding series. This protects the chart from provider/cache
  // contamination such as 255 -> 4253 -> 255 without changing normal
  // market moves. Negative/zero commodity prices are left untouched.
  for (let i = 0; i < closes.length; i += 1) {
    const prev = closes[i - 1];
    const next = closes[i + 1];
    const prev2 = closes[i - 2];
    const next2 = closes[i + 2];

    if (i === 0 && ratio(closes[i], next) >= 8 && ratio(next, next2) < 2) {
      outliers.add(i);
    } else if (
      i === closes.length - 1 &&
      ratio(prev, closes[i]) >= 8 &&
      ratio(prev2, prev) < 2
    ) {
      outliers.add(i);
    } else if (
      prev != null && next != null &&
      ratio(prev, closes[i]) >= 8 &&
      ratio(closes[i], next) >= 8 &&
      ratio(prev, next) < 2
    ) {
      outliers.add(i);
    }
  }

  if (!outliers.size) return candles;
  return candles.filter((_, index) => !outliers.has(index));
}

export function normalizeCandles(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Candles precisam ser uma lista');
  if (!rows.length) throw new Error('Nenhum candle recebido');

  const candles = rows.map((row, index) => {
    const candle = {
      // Aceita o contrato canônico e o contrato legado t/o/h/l/c/v.
      timestamp: timestamp(row.timestamp ?? row.t ?? row.time ?? row.date),
      open: number(row.open ?? row.o, 'open'),
      high: number(row.high ?? row.h, 'high'),
      low: number(row.low ?? row.l, 'low'),
      close: number(row.close ?? row.c, 'close'),
      volume: number(row.volume ?? row.v ?? 0, 'volume')
    };

    if (
      candle.high < candle.low ||
      candle.high < candle.open ||
      candle.high < candle.close ||
      candle.low > candle.open ||
      candle.low > candle.close
    ) {
      throw new Error(`Candle OHLC inválido no índice ${index}`);
    }

    if (candle.volume < 0) {
      throw new Error(`Candle inválido: volume negativo no índice ${index}`);
    }

    return candle;
  });

  candles.sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 1; i < candles.length; i += 1) {
    if (candles[i].timestamp === candles[i - 1].timestamp) {
      throw new Error(`Candle duplicado no timestamp ${candles[i].timestamp}`);
    }
  }

  return repairIsolatedScaleAnomalies(candles);
}
