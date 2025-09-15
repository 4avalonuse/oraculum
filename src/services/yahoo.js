// Serviço Yahoo via PHP proxy local
import { actions } from '../state/store.js';

export async function fetchYahoo(symbol='BTC-USD', interval='1d', range='1mo'){
  const yInterval = interval === '1w' ? '1wk' : interval;
  const url = `./api/yahoo.php?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(yInterval)}&range=${encodeURIComponent(range)}`;

  const attempt = async (msTimeout) => {
    const ctrl = new AbortController();
    const to = setTimeout(()=> ctrl.abort('timeout'), msTimeout);
    try{
      const t0 = Date.now();
      const res = await fetch(url, { headers:{ 'Accept':'application/json' }, signal: ctrl.signal });

      // ——— LOG DE CACHE humano ———
      const xCache = (res.headers.get('X-Cache') || 'UNKNOWN').toUpperCase();
      const xAge   = +(res.headers.get('X-Cache-Age') || 0);
      const xTtl   = +(res.headers.get('X-Cache-TTL') || 0);
      const fmtTime = s=>{
        if(!s || s<0) return '0s';
        const h = Math.floor(s/3600);
        const m = Math.floor((s%3600)/60);
        const ss = Math.floor(s%60);
        return h ? `${h}h ${m}m` : (m ? `${m}m ${ss}s` : `${ss}s`);
      };
      const tag = xCache==='HIT' ? 'background:#16a34a;color:#fff;padding:2px 6px;border-radius:4px'
                 : xCache==='MISS'? 'background:#2563eb;color:#fff;padding:2px 6px;border-radius:4px'
                 : xCache==='STALE'?'background:#d97706;color:#fff;padding:2px 6px;border-radius:4px'
                 : 'background:#6b7280;color:#fff;padding:2px 6px;border-radius:4px';
      console.info(
        `%c${xCache}%c  ${symbol}  •  tf=${yInterval}  •  range=${range}  •  idade=${fmtTime(xAge)}  •  ttl=${fmtTime(xTtl)}`,
        tag,'color:inherit'
      );
      actions.pushLog({
        level:'info', msg:'yahoo_cache', ts: Date.now(),
        data:{ cache:xCache, symbol, interval:yInterval, range,
               age_s:xAge, ttl_s:xTtl,
               age_human: fmtTime(xAge), ttl_human: fmtTime(xTtl) }
      });
      // ————————————————————————

      const txt = await res.text();
      if(!res.ok){
        actions.pushLog({level:'error', msg:'yahoo_http_error', ts: Date.now(), data:{status:res.status, body:txt.slice(0,200)}});
        throw new Error('yahoo_http_error');
      }

      let json;
      try{ json = JSON.parse(txt); } catch(e){
        actions.pushLog({level:'error', msg:'yahoo_json_parse', ts: Date.now(), data:{body:txt.slice(0,200)}});
        throw e;
      }
      validateYahoo(json);
      actions.pushLog({level:'info', msg:'yahoo_fetch_ok', ts: Date.now(), data:{ms: Date.now()-t0, interval:yInterval, range}});
      return normalize(symbol, yInterval, json);
    } finally { clearTimeout(to); }
  };

  try {
    return await attempt(6000);
  } catch (e1) {
    actions.pushLog({level:'warn', msg:'yahoo_retry', ts: Date.now(), data:{reason:String(e1)}});
    await sleep(300);
    return await attempt(9000);
  }
}

function sleep(ms){ return new Promise(r=> setTimeout(r, ms)); }

function validateYahoo(raw){
  const r = raw?.chart?.result?.[0];
  if(!r) throw new Error('yahoo_empty');
  const q = r.indicators?.quote?.[0] || {};
  const ts = r.timestamp || [];
  if(!Array.isArray(ts) || ts.length === 0) throw new Error('yahoo_no_timestamps');
  const keys = ['open','high','low','close','volume'];
  for(const k of keys){
    const arr = q[k] || [];
    if(arr.length && arr.length !== ts.length){
      throw new Error(`yahoo_misaligned_${k}`);
    }
  }
}

function normalize(symbol, interval, raw){
  const r = raw?.chart?.result?.[0];
  const q = r.indicators?.quote?.[0] || {};
  const ts = r.timestamp || [];
  const o = q.open || [], h = q.high || [], l = q.low || [], c = q.close || [], v = q.volume || [];
  const data = ts.map((t,i)=> ({ t: t*1000, o:o[i], h:h[i], l:l[i], c:c[i], v:v[i] }));
  return { meta:{ symbol, interval, fetchedAt: Date.now(), source:'yahoo' }, data };
}
