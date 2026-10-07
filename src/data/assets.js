export const ASSETS={
  'BTC-USD':{symbol:'BTC',name:'Bitcoin',provider:'yahoo',category:'asset'},
  'SOL-USD':{symbol:'SOL',name:'Solana',provider:'yahoo',category:'asset'},
  'RENDER-USD':{symbol:'RENDER',name:'Render',provider:'yahoo',category:'asset'},
  'JUP-USD':{symbol:'JUP',providerSymbol:'JUP29210-USD',name:'Jupiter',provider:'yahoo',category:'asset'},
  'ONDO-USD':{symbol:'ONDO',name:'Ondo',provider:'yahoo',category:'asset'},
  'GC=F':{symbol:'OURO',name:'Ouro',provider:'yahoo',category:'market',kind:'ohlcv'},
  'CL=F':{symbol:'PETRÓLEO',name:'Petróleo WTI',provider:'yahoo',category:'market',kind:'ohlcv'},
  '^GSPC':{symbol:'S&P 500',name:'S&P 500',provider:'yahoo',category:'market',kind:'ohlcv'},
  'DX-Y.NYB':{symbol:'DXY',name:'Dólar Index',provider:'yahoo',category:'market',kind:'ohlcv'},
  '^VIX':{symbol:'VIX',name:'VIX',provider:'yahoo',category:'market',kind:'ohlcv'},
  '^TNX':{symbol:'US 10Y',name:'Treasury 10 anos',provider:'yahoo',category:'market',kind:'ohlcv'}
};
export const DEFAULT_ASSET='BTC-USD';
export function getAsset(symbol){return ASSETS[symbol]||ASSETS[DEFAULT_ASSET]}
