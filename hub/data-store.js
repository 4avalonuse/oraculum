/**
 * Oraculum Data Store
 * Central store for OHLCV series with caching and window queries.
 */
import { eventBus } from './bus.js';
import { EVENTS } from './contracts.js';
import { loggers } from './logger.js';

const log = loggers.datastore;

export class OraculumDataStore {
  constructor() {
    this.series = new Map();      // key => { symbol, timeframe, rows, meta, index }
    this.queryCache = new Map();  // cacheKey => { data, timestamp }
    this.cacheTimeout = 5 * 60 * 1000;

    this.stats = { totalSeries:0, totalCandles:0, cacheHits:0, cacheMisses:0, lastUpdate:null };

    this._setupCacheGC();
    this._wireBus();
  }

  setSeries(symbol, timeframe, rows, meta = {}) {
    if (!Array.isArray(rows)) { log.warn('setSeries rows must be array'); return false; }
    const key = this._key(symbol,timeframe);
    const cleaned = this._clean(rows);
    const now = Date.now();

    const obj = {
      symbol, timeframe, rows: cleaned,
      meta: {
        count: cleaned.length,
        startTime: cleaned[0]?.t ?? null,
        endTime: cleaned.at(-1)?.t ?? null,
        source: meta.source || 'unknown',
        lastUpdate: now, ...meta
      },
      index: this._buildIndex(cleaned),
    };

    const existed = this.series.has(key);
    this.series.set(key, obj);
    if (!existed) this.stats.totalSeries++;
    this.stats.totalCandles += cleaned.length;
    this.stats.lastUpdate = now;
    this._clearCacheFor(key);

    eventBus.emit(EVENTS.DATA_UPDATED, { symbol, timeframe, count: cleaned.length, meta: obj.meta });
    log.info('stored', key, cleaned.length);
    return true;
  }

  getSeries(symbol, timeframe, window = null) {
    const key = this._key(symbol,timeframe);
    const cacheKey = this._cacheKey(key, window);
    const cached = this.queryCache.get(cacheKey);
    if (cached && !this._expired(cached)) {
      this.stats.cacheHits++; 
      return cached.data;
    }
    this.stats.cacheMisses++;

    const obj = this.series.get(key);
    if (!obj) return [];
    let out = obj.rows;
    if (window) out = this._window(out, window);
    this.queryCache.set(cacheKey, { data: out, timestamp: Date.now() });
    return out;
  }

  getSeriesMeta(symbol,timeframe) {
    return this.series.get(this._key(symbol,timeframe))?.meta ?? null;
  }
  hasSeries(symbol,timeframe) { return this.series.has(this._key(symbol,timeframe)); }

  export(symbol=null, timeframe=null) {
    const out = {};
    for (const [key,obj] of this.series) {
      const [sym,tf] = key.split(':');
      if (symbol && sym !== symbol) continue;
      if (timeframe && tf !== timeframe) continue;
      out[key] = { symbol: obj.symbol, timeframe: obj.timeframe, rows: obj.rows, meta: obj.meta };
    }
    return { version:1, exportedAt: Date.now(), series: out, stats: this.stats };
  }

  import(payload) {
    if (!payload?.series) return false;
    let count = 0;
    for (const k of Object.keys(payload.series)) {
      const s = payload.series[k];
      if (this.setSeries(s.symbol, s.timeframe, s.rows, s.meta)) count++;
    }
    log.info('imported series', count);
    return true;
  }

  // private
  _wireBus() {
    eventBus.on(EVENTS.DATA_REQUEST, ({ reqId, symbol, tf, window, source }) => {
      try {
        const rows = this.getSeries(symbol, tf, window);
        const meta = this.getSeriesMeta(symbol, tf);
        eventBus.emit(EVENTS.DATA_RESPONSE, {
          reqId, rows,
          meta: { ...(meta||{}), cached: true, source: source || 'datastore' }
        });
      } catch (err) {
        eventBus.emit(EVENTS.DATA_ERROR, { reqId, symbol, tf, error: String(err) });
      }
    });
  }

  _key(symbol, timeframe){ return `${symbol}:${timeframe}`; }
  _cacheKey(k, w){ return w ? `${k}:${JSON.stringify(w)}` : k; }
  _expired(entry){ return (Date.now() - entry.timestamp) > this.cacheTimeout; }

  _clean(rows){
    const seen = new Set();
    return rows.filter(r => {
      if (!r || !Number.isFinite(r.t)) return false;
      if (seen.has(r.t)) return false;
      seen.add(r.t); return true;
    }).sort((a,b)=>a.t-b.t);
  }
  _buildIndex(rows){
    const m = new Map();
    rows.forEach((r,i)=>m.set(r.t,i));
    return m;
  }
  _window(rows, w){
    let a = 0, b = rows.length-1;
    if (w.startTime != null) { a = rows.findIndex(r=>r.t>=w.startTime); if (a<0) a=0; }
    if (w.endTime   != null) { b = rows.findLastIndex ? rows.findLastIndex(r=>r.t<=w.endTime) : rows.map(r=>r.t<=w.endTime).lastIndexOf(true); if (b<0) b=rows.length-1; }
    if (w.startIndex!= null) a = Math.max(0, w.startIndex);
    if (w.endIndex  != null) b = Math.min(rows.length-1, w.endIndex);
    if (w.limit     != null) b = Math.min(b, a + w.limit - 1);
    return rows.slice(a, b+1);
  }
  _clearCacheFor(seriesKey){
    for (const k of [...this.queryCache.keys()]) if (k.startsWith(seriesKey)) this.queryCache.delete(k);
  }
  _setupCacheGC(){
    setInterval(()=>{
      const now = Date.now();
      for (const [k,v] of this.queryCache) if ((now - v.timestamp) > this.cacheTimeout) this.queryCache.delete(k);
    }, this.cacheTimeout);
  }
}

export const dataStore = new OraculumDataStore();
export const setSeries = (symbol, tf, rows, meta) => dataStore.setSeries(symbol, tf, rows, meta);
export const getSeries = (symbol, tf, window) => dataStore.getSeries(symbol, tf, window);
export const getSeriesMeta = (symbol, tf) => dataStore.getSeriesMeta(symbol, tf);
export const hasSeries = (symbol, tf) => dataStore.hasSeries(symbol, tf);

// expose for debugging
if (typeof window !== 'undefined') window.oraculumDataStore = dataStore;