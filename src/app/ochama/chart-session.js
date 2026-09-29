import { normalizeCandles } from '../../data/normalize.js';
import { createViewport } from '../../viewport/viewport.js';
import { createChart } from '../../chart/render.js';
import { attachPointerInteraction } from '../../interaction/pointer.js';
import { attachScaleToggle } from '../../ui/scale-toggle.js';
import { attachFitToggle } from '../../ui/fit-toggle.js';
import { createDrawingManager } from '../../drawing/core/drawing-manager.js';
import { createDrawingInteraction } from '../../drawing/interaction/drawing-controller.js?v=20260927-30';
import '../../drawing/tools/index.js';

const INITIAL_CANDLES=120;
const DATA_OPTIONS={currency:'USD'};
const PROVIDER_SYMBOLS={
  yahoo:{'BTC-USD':'BTC-USD','SOL-USD':'SOL-USD'},
  'binance-us':{'BTC-USD':'BTCUSD'}
};

function dataBoundsFor(c){
  if(!c.length)throw new Error('Nenhum candle disponível para o gráfico');
  return{x:{min:c[0].timestamp,max:c.at(-1).timestamp},y:{min:Math.min(...c.map(x=>x.low)),max:Math.max(...c.map(x=>x.high))}};
}

function visibleBoundsFor(c,v){
  return{x:{min:v[0]?.timestamp??c[0].timestamp,max:v.at(-1)?.timestamp??c.at(-1).timestamp},y:{min:Math.min(...v.map(x=>x.low)),max:Math.max(...v.map(x=>x.high))}};
}

export function createChartSession({dataClient,stateStore,drawingPersistence,elements,callbacks={}}){
  let active=null;
  let activeDrawingInteraction=null;

  const optionsFor=(symbol,provider,interval)=>{
    const providerSymbol=PROVIDER_SYMBOLS[provider]?.[symbol];
    if(!providerSymbol)throw new Error(`Servidor ${provider} não disponível para ${symbol}`);
    return{...DATA_OPTIONS,symbol:providerSymbol,provider,interval};
  };

  const saveActiveState=()=>{
    if(!active?.viewport)return;
    stateStore.save({symbol:active.symbol,provider:active.provider,interval:active.interval},active.viewport.getState());
  };

  const destroyActive=()=>{
    active?.scaleCleanup?.();
    active?.fitCleanup?.();
    active?.interaction?.detach?.();
    active?.chart?.destroy?.();
    if(active?.drawingManager)drawingPersistence.save(active.drawingManager.getDocument());
    active=null;
    activeDrawingInteraction=null;
  };

  const load=async(symbol,provider,interval='1d',result=null)=>{
    const {chartHost,status}=elements;
    chartHost.classList.add('is-loading');
    chartHost.classList.remove('is-error');
    status.textContent='Carregando '+symbol+' · '+provider+'…';

    const loaded=result||await dataClient.loadOrPopulate(optionsFor(symbol,provider,interval));
    const candles=normalizeCandles(loaded.candles);
    const meta=loaded.meta;

    saveActiveState();
    destroyActive();

    const savedDrawings=drawingPersistence.load({symbol,provider,interval});
    const viewport=createViewport();
    viewport.setDataBounds(dataBoundsFor(candles));

    const visible=candles.slice(-Math.min(INITIAL_CANDLES,candles.length));
    viewport.fitX(visibleBoundsFor(candles,visible).x);
    viewport.fitY(visibleBoundsFor(candles,visible).y);

    const savedState=stateStore.load({symbol,provider,interval});
    if(savedState)viewport.setState(savedState);

    const drawingManager=createDrawingManager({symbol,provider,interval,drawings:savedDrawings.drawings});
    const chart=createChart(elements.chartHost,candles,viewport,drawingManager,{
      onPaneChange:next=>callbacks.onPaneChange?.(Array.isArray(next)?next.map(item=>({...item})):[]),
      onPaneClose:studyId=>callbacks.onPaneClose?.(studyId)
    });

    chart.setChartType(elements.chartTypeButton?.getAttribute('aria-pressed')==='true'?'line':'candle');
    chart.setMovingAverages(callbacks.getMovingAverages?.()||[]);
    chart.setStudies(callbacks.getStudies?.()||[]);

    const persist=()=>stateStore.save({symbol,provider,interval},viewport.getState());

    let drawingInteraction;
    try{
      drawingInteraction=createDrawingInteraction({
        canvas:chart.canvas,
        viewport,
        drawingManager,
        draw:chart.draw,
        drawPreview:chart.setDrawingPreview,
        drawSelection:chart.setSelectedDrawingId,
        getPlot:chart.getDrawingPlot,
        onChanged:callbacks.onDrawingChanged,
        onComplete:()=>callbacks.setToolbarMode?.('navigation')
      });
    }catch(error){
      console.error('[Ochama drawing interaction]',error);
      status.textContent='Erro na interação de desenho: '+(error?.message||'falha desconhecida');
      chartHost.classList.remove('is-loading');
      chartHost.classList.add('is-error');
      throw error;
    }

    drawingInteraction.setTextEditor(callbacks.textEditorOpen);
    activeDrawingInteraction=drawingInteraction;

    const interaction=attachPointerInteraction({
      canvas:chart.canvas,
      viewport,
      draw:chart.draw,
      handlers:drawingInteraction.handlers,
      onViewportChanged:persist
    });
    interaction.setMode('navigation');

    const fitVisiblePrice=()=>{
      const state=viewport.getState();
      const shown=candles.filter(c=>c.timestamp>=state.x.min&&c.timestamp<=state.x.max);
      if(shown.length)viewport.fitY({min:Math.min(...shown.map(c=>c.low)),max:Math.max(...shown.map(c=>c.high))});
    };

    const scaleCleanup=attachScaleToggle({
      button:elements.scaleButton,
      viewport,
      draw:chart.draw,
      onScaleChanged:()=>{fitVisiblePrice();persist();}
    });

    const fitCleanup=attachFitToggle({
      button:elements.fitButton,
      viewport,
      candles,
      draw:chart.draw,
      onViewportChanged:persist
    });

    active={viewport,interaction,chart,scaleCleanup,fitCleanup,candles,symbol,provider,interval,meta,drawingManager};
    stateStore.saveSelection({symbol,provider,interval});
    window.ochama=active;
    callbacks.onActiveChanged?.(activeDrawingInteraction,active);
    chartHost.classList.remove('is-loading','is-error');
    callbacks.onHeaderUpdate?.(symbol,candles);
  };

  return Object.freeze({
    load,
    refresh:async(symbol,provider,interval)=>load(symbol,provider,interval,await dataClient.refresh(optionsFor(symbol,provider,interval))),
    getActive:()=>active,
    getDrawingInteraction:()=>activeDrawingInteraction,
    getProviderSymbols:()=>PROVIDER_SYMBOLS,
    getOptions:optionsFor,
    save:saveActiveState,
    destroy:destroyActive
  });
}
