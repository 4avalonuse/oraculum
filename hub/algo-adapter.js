/**
 * Algo Adapter
 * Registry for compiled strategies -> executable wrappers.
 * Strategy wrapper signature: (ctx) => {action:'buy'|'sell', qty?, price?, note?} | null
 */
import { eventBus } from './bus.js';
import { EVENTS } from './contracts.js';
import { loggers } from './logger.js';
const log = loggers.algo;

const registry = new Map();

export function registerStrategy(id, wrapper) {
  if (typeof wrapper !== 'function') throw new Error('Strategy wrapper must be a function');
  registry.set(id, wrapper);
  eventBus.emit(EVENTS.ALGO_REGISTERED, { id });
  log.info('registered', id);
}

export function getStrategy(id) {
  return registry.get(id) || null;
}

// sample strategy (optional): simple SMA crossover (periods passed via ctx.scope.params?)
registerStrategy('sample.sma', (ctx) => {
  // naive example: buy if current close above previous close, sell otherwise (placeholder)
  const n = ctx.series.length;
  if (n < 2) return null;
  const prev = ctx.series[n-2].c ?? ctx.series[n-2].close;
  const curr = ctx.series[n-1].c ?? ctx.series[n-1].close;
  if (!Number.isFinite(prev) || !Number.isFinite(curr)) return null;
  if (!ctx.position && curr > prev) return { action:'buy', note:'momentum up' };
  if (ctx.position && curr < prev)  return { action:'sell', note:'momentum down' };
  return null;
});