import { createDataClient } from '../data/client.js';
import { createChartStateStore } from '../storage/chart-state.js';
import { createDrawingPersistence } from '../drawing/storage/drawing-persistence.js';
import { createTextEditor } from '../ui/text-editor.js';
import { createStudyInfo } from '../ui/study-info.js';
import { attachMovingAverageMenu } from '../ui/moving-average-menu.js';
import { attachFibonacciMenu } from '../ui/fibonacci-menu.js?v=20260927-29';
import { attachDrawingToolsMenu } from '../ui/drawing-tools-menu.js';
import { createChartSession } from './ochama/chart-session.js';
import { createStudyController } from './ochama/study-controller.js';
import { createDrawingController } from './ochama/drawing-controller.js';
import { attachRsiMenu } from '../ui/rsi-menu.js?v=20260927-27';
import { attachVolumeMenu } from '../ui/volume-menu.js?v=20260927-32';
import { attachMacdMenu } from '../ui/macd-menu.js?v=20260927-33';
import { attachBollingerMenu } from '../ui/bollinger-menu.js?v=20260927-34';
import { attachAtrMenu } from '../ui/atr-menu.js';

const API_BASE='https://oraculum-data-api.4avalonuse.workers.dev';

const STUDIES={
  atr:{label:'ATR',attach:attachAtrMenu,activatedMessage:'ATR 14 ativado',configMessage:'Configuração do ATR',infoTitle:'ATR',infoText:'Mede a volatilidade do ativo pela amplitude real dos candles. Valores maiores indicam movimentos recentes mais amplos; valores menores indicam menor volatilidade.',defaultConfig:{study:'atr',period:14,color:'#dbe4ee',visible:true}},
  rsi:{label:'RSI',attach:attachRsiMenu,activatedMessage:'RSI 14 ativado',configMessage:'Configuração do RSI',infoTitle:'RSI',infoText:'Mede a força e a velocidade dos movimentos de preço. Valores altos indicam maior pressão compradora recente; valores baixos, maior pressão vendedora.',defaultConfig:{study:'rsi',period:14,levelLow:30,levelMid:50,levelHigh:70,color:'#dbe4ee',visible:true}},
  volume:{label:'Volume',attach:attachVolumeMenu,activatedMessage:'Volume ativado',configMessage:'Configuração do volume',infoTitle:'Volume',infoText:'Mostra a quantidade negociada em cada candle. Ajuda a observar a intensidade e a confirmação dos movimentos.',defaultConfig:{study:'volume',showAverage:true,averagePeriod:20,averageType:'sma',upColor:'#4ade80',downColor:'#f87171',averageColor:'#f59e0b',visible:true}},
  macd:{label:'MACD',attach:attachMacdMenu,activatedMessage:'MACD 12/26/9 ativado',configMessage:'Configuração do MACD',infoTitle:'MACD',infoText:'Compara médias móveis para mostrar mudanças de tendência e momentum.',defaultConfig:{study:'macd',fastPeriod:12,slowPeriod:26,signalPeriod:9,source:'close',macdColor:'#dbe4ee',signalColor:'#f59e0b',upColor:'#4ade80',downColor:'#f87171',visible:true}},
  bollinger:{label:'Bollinger',attach:attachBollingerMenu,activatedMessage:'Bollinger 20 · 2 ativado',configMessage:'Configuração das Bandas de Bollinger',infoTitle:'Bandas de Bollinger',infoText:'Cria uma média móvel central e bandas acima e abaixo dela com base na volatilidade.',defaultConfig:{study:'bollinger',period:20,multiplier:2,source:'close',showMiddle:true,upperColor:'#60a5fa',middleColor:'#f59e0b',lowerColor:'#60a5fa',showFill:true,fillColor:'#60a5fa',visible:true}}
};

const formatPrice=v=>Number(v).toLocaleString('en-US',{maximumFractionDigits:v>=100?2:6});
const updateHeader=(symbol,candles)=>{
  const latest=candles.at(-1);
  document.querySelector('#asset-price').textContent=latest?formatPrice(latest.close):'—';
  const label=symbol.replace('-USD','USD');
  document.querySelector('#asset-view-symbol').textContent=label;
};

export async function bootstrap(){
  const elements={
    status:document.querySelector('#status'),
    chartHost:document.querySelector('#chart'),
    scaleButton:document.querySelector('#scale-toggle'),
    fitButton:document.querySelector('#fit-toggle'),
    refreshButton:document.querySelector('#refresh-data'),
    assetSelect:document.querySelector('#asset-select'),
    providerSelect:document.querySelector('#provider-select'),
    intervalSelect:document.querySelector('#interval-select'),
    chartTypeButton:document.querySelector('#chart-type-toggle'),
    movingAverageButton:document.querySelector('#moving-average-button'),
    selectButton:document.querySelector('#drawing-select'),
    lineButton:document.querySelector('#drawing-line'),
    navButton:document.querySelector('#drawing-nav'),
    horizontalButton:document.querySelector('#drawing-horizontal'),
    verticalButton:document.querySelector('#drawing-vertical'),
    fibonacciButton:document.querySelector('#drawing-fibonacci'),
    moreButton:document.querySelector('#drawing-more'),
    undoButton:document.querySelector('#drawing-undo'),
    redoButton:document.querySelector('#drawing-redo'),
    deleteButton:document.querySelector('#drawing-delete'),
    colorInput:document.querySelector('#drawing-color')
  };

  const dataClient=createDataClient(API_BASE);
  const stateStore=createChartStateStore();
  const drawingPersistence=createDrawingPersistence();
  const textEditor=createTextEditor();
  const studyInfo=createStudyInfo();

  let movingAverageConfigs=[];
  let drawingController=null;
  let session=null;

  const movingAverageCleanup=attachMovingAverageMenu({
    button:elements.movingAverageButton,
    onChange:configs=>{
      movingAverageConfigs=configs;
      session.getActive()?.chart?.setMovingAverages(configs);
      elements.movingAverageButton?.setAttribute('aria-expanded','true');
    }
  });

  const studyController=createStudyController({
    definitions:STUDIES,
    status:elements.status,
    getChart:()=>session.getActive()?.chart,
    anchor:elements.moreButton
  });

  session=createChartSession({
    dataClient,
    stateStore,
    drawingPersistence,
    elements,
    callbacks:{
      getMovingAverages:()=>movingAverageConfigs,
      getStudies:()=>studyController.getConfigs(),
      textEditorOpen:textEditor.open,
      setToolbarMode:mode=>drawingController?.setToolbarMode(mode),
      onPaneChange:configs=>studyController.setConfigs(configs),
      onPaneClose:studyId=>{
        studyController.setConfigs(studyController.getConfigs().filter(item=>item.study!==studyId));
        elements.status.textContent='Painel de estudos fechado';
      },
      onDrawingChanged:()=>{
        const active=session.getActive();
        if(active?.drawingManager)drawingPersistence.save(active.drawingManager.getDocument());
        active?.chart?.draw();
        drawingController?.refreshActions();
      },
      onActiveChanged:()=>{
        drawingController?.refreshActions();
      },
      onHeaderUpdate:updateHeader
    }
  });

  drawingController=createDrawingController({
    elements,
    getInteraction:()=>session.getDrawingInteraction(),
    getActive:()=>session.getActive(),
    getStatus:()=>elements.status,
    studyController,
    studyInfo,
    attachFibonacciMenu,
    attachDrawingToolsMenu
  });

  studyController.attach();
  drawingController.bind();

  elements.chartTypeButton?.addEventListener('click',()=>{
    const isLine=elements.chartTypeButton.getAttribute('aria-pressed')==='true';
    const next=isLine?'candle':'line';
    elements.chartTypeButton.setAttribute('aria-pressed',String(next==='line'));
    elements.chartTypeButton.textContent=next==='line'?'LINE':'CANDLE';
    session.getActive()?.chart?.setChartType(next);
  });

  const syncProviders=()=>{
    const symbol=elements.assetSelect.value;
    [...elements.providerSelect.options].forEach(option=>option.hidden=symbol!=='BTC-USD'&&option.value!=='yahoo');
    if(symbol!=='BTC-USD')elements.providerSelect.value='yahoo';
  };

  const load=()=>session.load(elements.assetSelect.value,elements.providerSelect.value,elements.intervalSelect.value).catch(error=>{
    console.error('[Ochama]',error);
    elements.chartHost.classList.remove('is-loading');
    elements.chartHost.classList.add('is-error');
    elements.status.textContent='Erro: '+(error?.message||'falha desconhecida');
  });

  elements.assetSelect?.addEventListener('change',()=>{syncProviders();load();});
  elements.providerSelect?.addEventListener('change',load);
  elements.intervalSelect?.addEventListener('change',load);

  elements.refreshButton?.addEventListener('click',async()=>{
    const symbol=elements.assetSelect?.value||'BTC-USD';
    const provider=elements.providerSelect?.value||'yahoo';
    const interval=elements.intervalSelect?.value||'1d';
    elements.refreshButton.disabled=true;
    elements.status.textContent='Atualizando '+symbol+' · '+provider+'…';
    try{await session.refresh(symbol,provider,interval);}
    catch(error){console.error('[Ochama refresh]',error);elements.status.textContent='Refresh: '+(error?.message||'falha');elements.chartHost.classList.add('is-error');}
    finally{elements.refreshButton.disabled=false;}
  });

  window.addEventListener('pagehide',()=>{
    movingAverageCleanup?.();
    drawingController?.destroy();
    studyController.destroy();
    studyInfo.destroy();
    textEditor.destroy();
    session.save();
    const active=session.getActive();
    if(active?.drawingManager)drawingPersistence.save(active.drawingManager.getDocument());
  });

  const savedSelection=stateStore.loadSelection();
  if(savedSelection?.symbol&&session.getProviderSymbols()[savedSelection.provider]?.[savedSelection.symbol]){
    elements.assetSelect.value=savedSelection.symbol;
    elements.providerSelect.value=savedSelection.provider;
  }
  if(savedSelection?.interval&&[...elements.intervalSelect.options].some(option=>option.value===savedSelection.interval)){
    elements.intervalSelect.value=savedSelection.interval;
  }

  syncProviders();
  await session.load(elements.assetSelect?.value||'BTC-USD',elements.providerSelect?.value||'yahoo',elements.intervalSelect?.value||'1d');
}

bootstrap().catch(error=>{
  console.error('[Ochama]',error);
  document.querySelector('#chart')?.classList.remove('is-loading');
  document.querySelector('#chart')?.classList.add('is-error');
  const status=document.querySelector('#status');
  if(status)status.textContent='Erro: '+(error?.message||'falha desconhecida');
});
