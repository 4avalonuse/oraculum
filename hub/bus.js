/**
 * Oraculum Event Bus (native EventTarget)
 * Lightweight pub/sub with helpers and optional debug history.
 */
export class OraculumEventBus extends EventTarget {
  constructor() {
    super();
    // Debug flag via URL ?debug=events or localStorage key
    const urlHasDebug = typeof window !== 'undefined' && window.location?.search?.includes('debug=events');
    const lsDebug = typeof localStorage !== 'undefined' && localStorage.getItem('oraculum:bus-debug') === '1';
    this.debug = urlHasDebug || lsDebug;
    this.eventLog = [];
    this.maxLogSize = 1000;
  }

  emit(type, payload = {}, options = {}) {
    const detail = {
      ...payload,
      timestamp: Date.now(),
      v: payload?.v ?? 1,
      source: options.source || 'unknown'
    };
    const event = new CustomEvent(type, {
      detail,
      bubbles: !!options.bubbles,
      cancelable: !!options.cancelable
    });

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(`[EventBus] ${type}`, detail);
    }
    this._log(type, detail);
    this.dispatchEvent(event);
    return event;
  }

  on(type, handler, options = {}) {
    const wrapped = (ev) => {
      try {
        handler(ev.detail, ev);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[EventBus] handler error for ${type}:`, err);
        this.emit('bus:error', { originalEvent: type, error: String(err), stack: err?.stack });
      }
    };
    this.addEventListener(type, wrapped, options);
    return () => this.removeEventListener(type, wrapped, options);
  }

  once(type, handler) {
    return this.on(type, handler, { once: true });
  }

  waitFor(type, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const off = this.once(type, (detail) => {
        clearTimeout(timer);
        resolve(detail);
      });
      const timer = setTimeout(() => {
        off();
        reject(new Error(`Timeout waiting for event: ${type}`));
      }, timeout);
    });
  }

  setDebug(enabled) {
    this.debug = !!enabled;
    try {
      if (enabled) localStorage.setItem('oraculum:bus-debug', '1');
      else localStorage.removeItem('oraculum:bus-debug');
    } catch {}
  }

  getEventHistory(type = null, limit = 50) {
    let list = this.eventLog;
    if (type) list = list.filter(e => e.type === type);
    return list.slice(-limit);
  }

  getStats() {
    const counts = {};
    for (const e of this.eventLog) counts[e.type] = (counts[e.type] || 0) + 1;
    return {
      total: this.eventLog.length,
      types: Object.keys(counts).length,
      top: Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10)
    };
  }

  _log(type, data) {
    this.eventLog.push({ type, data, timestamp: data?.timestamp || Date.now() });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }
  }
}

export const eventBus = new OraculumEventBus();

export const emit = (...args) => eventBus.emit(...args);
export const on = (...args) => eventBus.on(...args);
export const once = (...args) => eventBus.once(...args);
export const waitFor = (...args) => eventBus.waitFor(...args);

// basic global error log
eventBus.on('bus:error', ({ originalEvent, error }) => {
  // eslint-disable-next-line no-console
  console.error(`[EventBus] error raised by ${originalEvent}:`, error);
});