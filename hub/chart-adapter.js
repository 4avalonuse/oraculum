// hub/chart-adapter.js
/**
 * Chart Adapter
 * Bridges backtest events to OChart (optional methods guarded).
 */
import { eventBus } from './bus.js';
import { EVENTS } from './contracts.js';
import { loggers } from './logger.js';

const log = loggers.chart;

export class ChartAdapter {
  constructor() {
    this.engine = null;
    this.annotations = new Map(); // runId -> array
  }

  wire(engine) {
    this.engine = engine;
    this._wireEvents();
    log.info('wired to engine');
    return this;
  }

  _wireEvents() {
    eventBus.on(EVENTS.BACKTEST_TRADE, ({ runId, trade }) => {
      this._addTradeLabel(runId, trade);
    });
    eventBus.on(EVENTS.BACKTEST_EQUITY, ({ runId, point }) => {
      this._updateEquity(runId, point);
    });
    eventBus.on(EVENTS.BACKTEST_DONE, ({ runId }) => {
      log.info('run done', runId);
    });
  }

  _addTradeLabel(runId, trade) {
    if (!this.engine || typeof this.engine.addAnnotation !== 'function') {
      log.debug('engine.addAnnotation not available; skipping trade label');
      return;
    }
    const color = trade.side === 'buy' ? '#4caf50' : '#f44336';
    const ann = {
      id: `trade_${trade.id}`,
      type: 'label',
      x: trade.ts,
      y: trade.price,
      content: (trade.side === 'buy' ? '🟢' : '🔴') + trade.side.toUpperCase(),
      style: { color, backgroundColor: color + '22' }
    };
    this.engine.addAnnotation(ann);
    const list = this.annotations.get(runId) || [];
    list.push(ann);
    this.annotations.set(runId, list);
  }

  _updateEquity(runId, point) {
    if (!this.engine || typeof this.engine.updateOverlay !== 'function') {
      return; // sem overlay API
    }
    const key = `equity_${runId}`;
    const overlay = {
      id: key,
      type: 'line',
      label: 'Equity',
      append: true,
      data: [{ x: point.t, y: point.equity }],
      style: { color: '#2196f3', width: 2, opacity: .85 }
    };
    this.engine.updateOverlay(overlay);
  }
}
