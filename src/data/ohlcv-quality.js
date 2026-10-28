/* Detecta datasets OHLCV legados suspeitos sem executar requisições. */
export function needsOhlcvRepair(loaded) {
    const candles = loaded?.candles;
    if (!Array.isArray(candles) || candles.length < 10) return false;

    // A legacy series dataset can masquerade as OHLCV by repeating its
    // single value across open/high/low/close. Never let that reach the chart.
    const collapsed = candles.reduce((count, candle) => {
      const open = Number(candle?.open ?? candle?.o);
      const high = Number(candle?.high ?? candle?.h);
      const low = Number(candle?.low ?? candle?.l);
      const close = Number(candle?.close ?? candle?.c);
      return count + (
        Number.isFinite(open) &&
        Number.isFinite(high) &&
        Number.isFinite(low) &&
        Number.isFinite(close) &&
        open === high &&
        high === low &&
        low === close
          ? 1
          : 0
      );
    }, 0);

    const scaleRatio = (a, b) => {
      if (!(a > 0) || !(b > 0)) return Infinity;
      return Math.max(a, b) / Math.min(a, b);
    };

    const first = candles[0];
    const second = candles[1];
    const third = candles[2];
    const last = candles.at(-1);
    const beforeLast = candles.at(-2);
    const beforeBeforeLast = candles.at(-3);
    const value = (candle, long, short) => Number(candle?.[long] ?? candle?.[short]);
    const edgeScaleAnomaly =
      candles.length >= 3 &&
      (
        (
          scaleRatio(value(first, "close", "c"), value(second, "close", "c")) >= 2 &&
          scaleRatio(value(second, "close", "c"), value(third, "close", "c")) <= 1.10
        ) ||
        (
          scaleRatio(value(last, "close", "c"), value(beforeLast, "close", "c")) >= 2 &&
          scaleRatio(value(beforeLast, "close", "c"), value(beforeBeforeLast, "close", "c")) <= 1.10
        )
      );
    const edgeWickAnomaly =
      candles.length >= 3 &&
      (
        value(first, "high", "h") > Math.max(value(second, "high", "h"), value(third, "high", "h")) * 3 ||
        (value(first, "low", "l") > 0 && value(first, "low", "l") < Math.min(value(second, "low", "l"), value(third, "low", "l")) / 3) ||
        value(last, "high", "h") > Math.max(value(beforeLast, "high", "h"), value(beforeBeforeLast, "high", "h")) * 3 ||
        (value(last, "low", "l") > 0 && value(last, "low", "l") < Math.min(value(beforeLast, "low", "l"), value(beforeBeforeLast, "low", "l")) / 3)
      );

    return collapsed / candles.length >= 0.95 || edgeScaleAnomaly || edgeWickAnomaly;
  }

