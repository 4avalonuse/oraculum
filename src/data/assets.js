export const ASSETS={
  'BTC-USD':{symbol:'BTC',name:'Bitcoin',provider:'yahoo'},
  'SOL-USD':{symbol:'SOL',name:'Solana',provider:'yahoo'},
  'RENDER-USD':{symbol:'RENDER',name:'Render',provider:'yahoo'},
  'JUP-USD':{symbol:'JUP',providerSymbol:'JUP29210-USD',name:'Jupiter',provider:'yahoo'},
  'ONDO-USD':{symbol:'ONDO',name:'Ondo',provider:'yahoo'}
};
export const DEFAULT_ASSET='BTC-USD';
export function getAsset(symbol){return ASSETS[symbol]||ASSETS[DEFAULT_ASSET]}
