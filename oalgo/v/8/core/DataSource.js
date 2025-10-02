// core/DataSource.js — busca OHLC de endpoint e normaliza formatos comuns
var DataSource = (function(){
  async function fetchOHLC(url){
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }

  // Converte resposta OHLC em array de preços de fechamento
  function ohlcToClose(payload){
    if (!payload) return [];

    // Formato 1: array de objetos { o,h,l,c,v, t? }
    if (Array.isArray(payload) && payload.length && typeof payload[0]==='object'){
      const key = detectCloseKey(payload[0]);
      if (key){
        return payload
          .map(r => Number(r[key]))
          .filter(v => Number.isFinite(v));
      }
    }
    // Formato 2: array de arrays [t,o,h,l,c,v] ou [o,h,l,c]
    if (Array.isArray(payload) && Array.isArray(payload[0])){
      return payload.map(row => {
        const c = row.length>=5 ? row[4] : row[row.length-1];
        return Number(c);
      }).filter(v => Number.isFinite(v));
    }
    // Formato 3: objeto com .candles ou .data
    if (payload && Array.isArray(payload.candles)){
      const key = detectCloseKey(payload.candles[0]);
      if (key) return payload.candles.map(r => Number(r[key])).filter(Number.isFinite);
    }
    if (payload && Array.isArray(payload.data)){
      const key = detectCloseKey(payload.data[0]);
      if (key) return payload.data.map(r => Number(r[key])).filter(Number.isFinite);
    }
    return [];
  }

  function detectCloseKey(obj){
    const candidates = ['c','close','Close','closing','adjClose','AdjClose'];
    for (const k of candidates){
      if (k in obj) return k;
    }
    return null;
  }

  return { fetchOHLC, ohlcToClose };
})();
