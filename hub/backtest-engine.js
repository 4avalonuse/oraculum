/**
 * Backtest Engine (single-thread)
 * Executes strategy wrappers over historical series and emits events.
 */
import { eventBus } from './bus.js';
import { EVENTS } from './contracts.js';
import { dataStore } from './data-store.js';
import { getStrategy } from './algo-adapter.js';
import { loggers } from './logger.js';
const log = loggers.backtest;

export class BacktestEngine {
  constructor() {
    this.active = new Map();  // runId -> run state
    this.history = new Map(); // runId -> completed
    eventBus.on(EVENTS.BACKTEST_RUN, (cfg)=>this.startBacktest(cfg));
  }

  async startBacktest(config) {
    const runId = config.runId || (crypto?.randomUUID?.() || String(Date.now()));
    const strategy = getStrategy(config.strategyId);
    if (!strategy) throw new Error(`Strategy not found: ${config.strategyId}`);

    const series = dataStore.getSeries(config.scope.symbol, config.scope.tf, config.scope.window);
    if (!series.length) throw new Error(`No data for ${config.scope.symbol}:${config.scope.tf}`);

    const capital = Number(config?.capital?.initial || 10000);
    const feePct = Number(config?.costs?.feePct ?? 0.001);
    const slippagePct = Number(config?.costs?.slippagePct ?? 0.0005);

    const run = {
      runId, strategyId: config.strategyId, config, series,
      status:'starting', progress:0,
      portfolio: { cash:capital, equity:capital, positions:new Map(), maxEquity:capital, maxDrawdown:0 },
      trades:[], equityHistory:[], currentIndex:0,
      startTime: Date.now(), endTime:null, metrics:null
    };
    this.active.set(runId, run);

    eventBus.emit(EVENTS.BACKTEST_STATUS, { runId, phase:'starting', progress:0 });
    log.info('start', runId, series.length);

    try {
      for (let i=0;i<series.length;i++){
        if (run.status==='canceled') break;
        run.currentIndex = i;
        const candle = series[i];

        const position = run.portfolio.positions.size ? [...run.portfolio.positions.values()][0] : null;
        const ctx = {
          index:i, candle, series: series.slice(0, i+1),
          equity: run.portfolio.equity,
          position: position ? { side:position.side, entry:position.avgPrice, qty:position.qty } : null,
          scope: config.scope
        };
        const signal = strategy(ctx);
        if (signal) this._applySignal(run, signal, candle, { feePct, slippagePct });

        this._markToMarket(run, candle);
        this._recordEquity(run, candle);

        if (i%50===0 || i===series.length-1) {
          run.progress = (i+1)/series.length;
          eventBus.emit(EVENTS.BACKTEST_STATUS, { runId, phase:'running', progress: run.progress });
          await new Promise(r=>setTimeout(r,0)); // yield
        }
      }
      this._finalize(run);
      this.history.set(runId, {...run});
      this.active.delete(runId);

      eventBus.emit(EVENTS.BACKTEST_METRICS, { runId, metrics: run.metrics });
      eventBus.emit(EVENTS.BACKTEST_STATUS, { runId, phase:'done', progress:1 });
      eventBus.emit(EVENTS.BACKTEST_DONE, { runId });
      log.info('done', runId, run.metrics);
      return runId;
    } catch (err) {
      run.status='error'; run.error=String(err);
      this.active.delete(runId);
      eventBus.emit(EVENTS.BACKTEST_ERROR, { runId, error: run.error });
      throw err;
    }
  }

  cancelBacktest(runId){
    const run = this.active.get(runId);
    if (!run) return false;
    run.status='canceled';
    this.active.delete(runId);
    eventBus.emit(EVENTS.BACKTEST_CANCELED, { runId });
    return true;
  }

  getRunStatus(runId){
    const r = this.active.get(runId);
    if (!r) return null;
    return { runId, status:r.status, progress:r.progress, currentIndex:r.currentIndex, totalCandles:r.series.length, startTime:r.startTime };
  }
  getRunResults(runId){ return this.history.get(runId) || null; }
  listRuns(){
    return [
      ...[...this.active.values()].map(r=>({ runId:r.runId, status:r.status, progress:r.progress })),
      ...[...this.history.values()].map(r=>({ runId:r.runId, status:'completed', progress:1, metrics:r.metrics }))
    ];
  }

  // internals
  _applySignal(run, sig, candle, { feePct, slippagePct }){
    const side = sig.action;
    if (side==='buy') this._buy(run, candle, sig, feePct, slippagePct);
    if (side==='sell') this._sell(run, candle, sig, feePct, slippagePct);
  }

  _buy(run, candle, sig, feePct, slippagePct){
    const posCountAllowed = Number(run.config?.engine?.maxPositions ?? 1);
    if (run.portfolio.positions.size >= posCountAllowed) return;

    const orderPrice = sig.price || candle.c;
    const slip = orderPrice * slippagePct;
    const exec = orderPrice + slip;
    const alloc = sig.qty ? sig.qty*exec : run.portfolio.cash * 0.5;
    const qty = sig.qty || (alloc / exec);
    const cost = qty * exec;
    const fee = cost * feePct;
    const need = cost + fee;
    if (need > run.portfolio.cash) return;

    const id = `pos_${run.trades.length+1}`;
    const position = { id, side:'long', qty, avgPrice:exec, totalCost:need, openTime:candle.t, openIndex:run.currentIndex };
    run.portfolio.cash -= need;
    run.portfolio.positions.set(id, position);

    const trade = { id:`trade_${run.trades.length+1}`, ts:candle.t, side:'buy', type:'market', price:exec, qty, fee, slippage:slip, pnl:0, note:sig.note||'' , positionId:id};
    run.trades.push(trade);
    eventBus.emit(EVENTS.BACKTEST_TRADE, { runId: run.runId, trade });
  }

  _sell(run, candle, sig, feePct, slippagePct){
    const position = run.portfolio.positions.size ? [...run.portfolio.positions.values()][0] : null;
    if (!position || position.side!=='long') return;
    const orderPrice = sig.price || candle.c;
    const slip = orderPrice * slippagePct;
    const exec = orderPrice - slip;
    const qty = sig.qty || position.qty;

    const gross = qty * exec;
    const fee = gross * feePct;
    const net = gross - fee;
    const costBasis = (position.totalCost/position.qty) * qty;
    const pnl = net - costBasis;

    run.portfolio.cash += net;
    if (qty >= position.qty) run.portfolio.positions.delete(position.id);
    else {
      position.qty -= qty;
      position.totalCost -= costBasis;
    }

    const trade = { id:`trade_${run.trades.length+1}`, ts:candle.t, side:'sell', type:'market', price:exec, qty, fee, slippage:slip, pnl, note:sig.note||'', positionId:position.id };
    run.trades.push(trade);
    eventBus.emit(EVENTS.BACKTEST_TRADE, { runId: run.runId, trade });
  }

  _markToMarket(run, candle){
    let unreal = 0;
    for (const p of run.portfolio.positions.values()){
      if (p.side==='long') unreal += p.qty * (candle.c - p.avgPrice);
    }
    run.portfolio.equity = run.portfolio.cash + unreal;
    if (run.portfolio.equity > run.portfolio.maxEquity) run.portfolio.maxEquity = run.portfolio.equity;
    const dd = (run.portfolio.maxEquity - run.portfolio.equity) / run.portfolio.maxEquity;
    if (dd > run.portfolio.maxDrawdown) run.portfolio.maxDrawdown = dd;
  }

  _recordEquity(run, candle){
    const point = { t:candle.t, equity: run.portfolio.equity, drawdown: run.portfolio.maxDrawdown };
    run.equityHistory.push(point);
    if (run.equityHistory.length % 10 === 0) {
      eventBus.emit(EVENTS.BACKTEST_EQUITY, { runId: run.runId, point });
    }
  }

  _finalize(run){
    run.status='completed'; run.endTime = Date.now();
    run.metrics = this._metrics(run);
  }

  _metrics(run){
    const init = run.config.capital.initial;
    const final = run.portfolio.equity;
    const totalReturn = (final - init)/init;

    const winners = run.trades.filter(t=>t.pnl>0);
    const losers  = run.trades.filter(t=>t.pnl<0);
    const winRate = run.trades.length ? winners.length / run.trades.length : 0;
    const profit  = winners.reduce((s,t)=>s+t.pnl,0);
    const lossAbs = Math.abs(losers.reduce((s,t)=>s+t.pnl,0));
    const profitFactor = lossAbs>0 ? (profit/lossAbs) : (profit>0?Infinity:0);

    // daily returns approx from equity history
    const rets = [];
    for (let i=1;i<run.equityHistory.length;i++){
      const prev = run.equityHistory[i-1].equity;
      const curr = run.equityHistory[i].equity;
      if (prev>0) rets.push((curr-prev)/prev);
    }
    const avg = rets.length ? rets.reduce((a,b)=>a+b,0)/rets.length : 0;
    const std = Math.sqrt(rets.reduce((s,r)=>s+Math.pow(r-avg,2),0)/(rets.length||1));
    const sharpe = std>0 ? (avg/std) * Math.sqrt(252) : 0;

    return {
      totalReturn,
      maxDrawdown: run.portfolio.maxDrawdown,
      winRate,
      profitFactor,
      totalTrades: run.trades.length,
      sharpeRatio: sharpe
    };
  }
}

export const backtestEngine = new BacktestEngine();
export const startBacktest = (cfg) => backtestEngine.startBacktest(cfg);
export const cancelBacktest = (id) => backtestEngine.cancelBacktest(id);
export const getBacktestStatus = (id) => backtestEngine.getRunStatus(id);
export const getBacktestResults = (id) => backtestEngine.getRunResults(id);
export const listBacktests = () => backtestEngine.listRuns();