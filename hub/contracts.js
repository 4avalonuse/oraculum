/**
 * Oraculum Event Contracts (single source of truth)
 */
export const PROTOCOL = { version: 1 };

export const EVENTS = Object.freeze({
  // Data
  DATA_REQUEST:    'data:request',
  DATA_RESPONSE:   'data:response',
  DATA_UPDATED:    'data:updated',
  DATA_ERROR:      'data:error',

  // Algo
  ALGO_REGISTERED: 'algo:registered',
  ALGO_COMPILED:   'algo:compiled',
  ALGO_ERROR:      'algo:error',

  // Backtest
  BACKTEST_RUN:     'backtest:run',
  BACKTEST_STATUS:  'backtest:status',
  BACKTEST_TRADE:   'backtest:trade',
  BACKTEST_EQUITY:  'backtest:equity',
  BACKTEST_METRICS: 'backtest:metrics',
  BACKTEST_DONE:    'backtest:done',
  BACKTEST_ERROR:   'backtest:error',
  BACKTEST_CANCELED:'backtest:canceled',
});