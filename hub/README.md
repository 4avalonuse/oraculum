# Oraculum Hub (front-end integration)

Vanilla ES modules to integrate OChart (view), OAlgo (builder), OBacktest (engine), OWin (live).

## Files

- `bus.js` — native Event Bus (EventTarget). Helpers: `emit`, `on`, `once`, `waitFor`.
- `contracts.js` — events catalog (`EVENTS`) and protocol version.
- `logger.js` — tiny namespaced logger; set level with `localStorage.setItem('oraculum:log-level','debug')`.
- `data-store.js` — central OHLCV store, answers `data:request` with `data:response`.
- `algo-adapter.js` — registry for compiled strategies (includes `sample.sma` example).
- `backtest-engine.js` — single-thread backtest loop emitting trade/equity/metrics.
- `chart-adapter.js` — optional bridge that paints trades/equity if `ChartEngine` exposes `addAnnotation/updateOverlay`.

## Quick start

```js
// 1) feed data
import { setSeries } from './data-store.js';
setSeries('BTC-USD','1d', rows);

// 2) wire chart
import { ChartAdapter } from './chart-adapter.js';
const adapter = new ChartAdapter().wire(engine); // engine = your ChartEngine instance

// 3) register strategy (or use 'sample.sma')
import { registerStrategy } from './algo-adapter.js';
registerStrategy('my.strat', (ctx)=>{ /* ... */ return null; });

// 4) run backtest
import { startBacktest } from './backtest-engine.js';
startBacktest({ strategyId:'my.strat', scope:{ symbol:'BTC-USD', tf:'1d' }, capital:{ initial:10000 } });
```

## Notes
- Everything is framework-free; ES modules only.
- Event Bus debug: add `?debug=events` in URL or `localStorage.setItem('oraculum:bus-debug','1')`.
- All event names live in `contracts.js` to avoid drift.