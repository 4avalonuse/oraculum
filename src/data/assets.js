export const ASSETS={
  'BTC-USD':{symbol:'BTC',name:'Bitcoin',provider:'yahoo',category:'crypto'},
  'SOL-USD':{symbol:'SOL',name:'Solana',provider:'yahoo',category:'crypto'},

  'TEST-A':{symbol:'TEST-A',name:'Controle · crescimento conhecido',provider:'synthetic',category:'test',kind:'ohlcv'},
  'TEST-B':{symbol:'TEST-B',name:'Controle · beta conhecido',provider:'synthetic',category:'test',kind:'ohlcv'},
  'TEST-C':{symbol:'TEST-C',name:'Controle · autocorrelação',provider:'synthetic',category:'test',kind:'ohlcv'},
  'RENDER-USD':{symbol:'RENDER',name:'Render',provider:'yahoo',category:'crypto'},
  'JUP-USD':{symbol:'JUP',providerSymbol:'JUP29210-USD',name:'Jupiter',provider:'yahoo',category:'crypto'},
  'ONDO-USD':{symbol:'ONDO',name:'Ondo',provider:'yahoo',category:'crypto'},

  'GC=F':{symbol:'OURO',name:'Ouro',provider:'yahoo',category:'commodity',kind:'ohlcv'},
  'CL=F':{symbol:'PETRÓLEO',name:'Petróleo WTI',provider:'yahoo',category:'commodity',kind:'ohlcv'},

  '^GSPC':{symbol:'S&P 500',name:'S&P 500',provider:'yahoo',category:'index',kind:'ohlcv'},
  'DX-Y.NYB':{symbol:'DXY',name:'Dólar Index',provider:'yahoo',category:'index',kind:'ohlcv'},
  '^VIX':{symbol:'VIX',name:'VIX',provider:'yahoo',category:'index',kind:'ohlcv'},

  '^TNX':{symbol:'US 10Y',name:'Treasury 10 anos',provider:'yahoo',category:'rates',kind:'ohlcv'},

  'MSTR':{symbol:'MSTR',name:'Strategy',provider:'yahoo',category:'stock',kind:'ohlcv'},
  'COIN':{symbol:'COIN',name:'Coinbase',provider:'yahoo',category:'stock',kind:'ohlcv'},
  'NVDA':{symbol:'NVDA',name:'NVIDIA',provider:'yahoo',category:'stock',kind:'ohlcv'},
  'AAPL':{symbol:'AAPL',name:'Apple',provider:'yahoo',category:'stock',kind:'ohlcv'},
  'MSFT':{symbol:'MSFT',name:'Microsoft',provider:'yahoo',category:'stock',kind:'ohlcv'},

  'IBIT':{symbol:'IBIT',name:'iShares Bitcoin Trust',provider:'yahoo',category:'btc-etf',kind:'ohlcv'}
};

export const ASSET_CATEGORIES=[
  {id:'crypto',label:'CRIPTO',short:'CRYPTO'},
  {id:'test',label:'TESTE',short:'TESTE'},
  {id:'stock',label:'AÇÕES',short:'AÇÕES'},
  {id:'btc-etf',label:'ETF · BTC',short:'ETF BTC'},
  {id:'index',label:'ÍNDICES',short:'ÍNDICES'},
  {id:'commodity',label:'COMMODITIES',short:'COMMOD.'},
  {id:'rates',label:'JUROS',short:'JUROS'}
];

export const DEFAULT_ASSET='BTC-USD';

export function getAsset(symbol){return ASSETS[symbol]||ASSETS[DEFAULT_ASSET]}

export function getAssetsByCategory(category){
  return Object.entries(ASSETS)
    .filter(([,asset])=>asset.category===category)
    .map(([value,asset])=>({value,...asset}));
}
