/**
 * Tiny namespaced logger
 * set level via localStorage 'oraculum:log-level' (trace|debug|info|warn|error)
 */
const LEVELS = ['trace','debug','info','warn','error'];

function getLevel() {
  try {
    const v = localStorage.getItem('oraculum:log-level');
    if (LEVELS.includes(v)) return v;
  } catch {}
  return 'info';
}

const LEVEL_COLORS = {
  trace: 'color:#64748b',
  debug: 'color:#0ea5e9',
  info:  'color:#22c55e',
  warn:  'color:#eab308',
  error: 'color:#ef4444'
};

export function createLogger(namespace) {
  const levelIdx = () => LEVELS.indexOf(getLevel());
  const fmt = (lvl, args) => ['%c['+namespace+']'+' '+lvl.toUpperCase(), LEVEL_COLORS[lvl], ...args];

  return {
    trace: (...a) => { if (0 <= levelIdx()) console.log(...fmt('trace', a)); },
    debug: (...a) => { if (1 <= levelIdx()) console.log(...fmt('debug', a)); },
    info:  (...a) => { if (2 <= levelIdx()) console.log(...fmt('info',  a)); },
    warn:  (...a) => { if (3 <= levelIdx()) console.warn(...fmt('warn', a)); },
    error: (...a) => { if (4 <= levelIdx()) console.error(...fmt('error', a)); },
  };
}

export const loggers = {
  core: createLogger('core'),
  datastore: createLogger('datastore'),
  algo: createLogger('algo'),
  backtest: createLogger('backtest'),
  chart: createLogger('chart'),
  bus: createLogger('bus'),
};
