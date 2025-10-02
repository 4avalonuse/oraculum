/**
 * Data Loader — camada de acesso a dados
 * --------------------------------------
 * Carrega séries OHLCV via:
 *  - Arquivos estáticos (cache/json)
 *  - API PHP (yahoo.php)
 *  - Cache local (localStorage)
 *
 * Fornece fetchSeries(tf) com fallback/resiliência.
 */

const QS = new URLSearchParams(location.search);
const STATIC_MODE =
  location.hostname.endsWith('github.io') ||
  location.protocol === 'file:' ||
  QS.get('static') === '1';

/** 
 * Detecta, de forma robusta, a base de API do OChart.
 * - Se o caminho do módulo contiver "/ochart/", fixa para ".../ochart/api/"
 * - Caso contrário, faz o fallback relativo "../../api/"
 */
function computeApiBase() {
  const u = new URL(import.meta.url);
  const p = u.pathname;
  const marker = '/ochart/';
  const i = p.indexOf(marker);
  if (i !== -1) {
    // Ex.: /oraculum/ochart/src/core/data-loader.js  ->  /oraculum/ochart/api/
    return p.slice(0, i + marker.length) + 'api/';
  }
  // Fallback relativo (mantém compatibilidade)
  return new URL('../../api/', import.meta.url).pathname;
}

const API_BASE = computeApiBase();

const STATIC_MAP = {
  '1h':  API_BASE + 'cache/BTC-USD_60m_3mo.json',
  '1d':  API_BASE + 'cache/BTC-USD_1d_max.json',
  '1w':  API_BASE + 'cache/BTC-USD_1wk_max.json',
  '1mo': API_BASE + 'cache/BTC-USD_1mo_max.json'
};
const staticUrlFor = (tf) => QS.get('file') || STATIC_MAP[tf] || STATIC_MAP['1d'];

const cacheKey  = (tf) => `ochart:lastPayload:BTC-USD:${tf}`;
const saveCache = (tf, payload) => { try { localStorage.setItem(cacheKey(tf), JSON.stringify(payload)); } catch(_){} };
const readCache = (tf) => { try { const r = localStorage.getItem(cacheKey(tf)); return r ? JSON.parse(r) : null; } catch { return null; } };

async function fetchJSON(url) {
  const res  = await fetch(url, { headers:{ 'Accept':'application/json' }, cache:'no-store' });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; }
  catch { throw new Error(`JSON malformado em ${url}`); }
  if (!res.ok) throw new Error((json && (json.message || json.error)) || `HTTP ${res.status} em ${url}`);
  if (!json || typeof json !== 'object') throw new Error(`Payload vazio em ${url}`);
  return { json, headers: res.headers };
}

async function fetchFromStatic(tf) {
  const url = staticUrlFor(tf);
  const { json } = await fetchJSON(url);
  console.info('%cSTATIC%c ' + url, 'background:#16a34a;color:#fff;padding:2px 6px;border-radius:4px', 'color:inherit');
  json.meta = { ...(json.meta||{}), source:'static', url };
  return json;
}

async function fetchFromPHP(tf, scale) {
  const interval = mapInterval(tf);
  const range    = requestRange(tf);
  const pos      = (scale === 'logarithmic') ? '1' : '0';
  const url      = API_BASE + `yahoo.php?symbol=BTC-USD&interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}&sanitized=1&pos=${pos}`;
  const { json, headers } = await fetchJSON(url);
  const xCache = (headers.get('X-Cache') || 'API').toUpperCase();
  console.info(`%c${xCache}%c via PHP • tf=${tf}`, 'background:#2563eb;color:#fff;padding:2px 6px;border-radius:4px', 'color:inherit');
  json.meta = { ...(json.meta||{}), source:'php', url };
  return json;
}

/**
 * Carrega série histórica com fallback
 * @param {string} tf - '1h' | '1d' | '1w' | '1mo'
 * @param {string} scale - 'linear' | 'logarithmic'
 */
export async function fetchSeries(tf='1d', scale='logarithmic'){
  const preferStatic = STATIC_MODE;
  const errors = [];

  if (preferStatic) {
    try { const p = await fetchFromStatic(tf); saveCache(tf, p); return p; } catch (e) { errors.push(e); }
    try { const p = await fetchFromPHP(tf, scale); saveCache(tf, p); return p; } catch (e) { errors.push(e); }
  } else {
    try { const p = await fetchFromPHP(tf, scale); saveCache(tf, p); return p; } catch (e) { errors.push(e); }
    try { const p = await fetchFromStatic(tf); saveCache(tf, p); return p; } catch (e) { errors.push(e); }
  }

  const cached = readCache(tf);
  if (cached && Array.isArray(cached.data) && cached.data.length) {
    console.warn('Usando cache local (último sucesso).');
    cached.meta = { ...(cached.meta||{}), source:'cache' };
    return cached;
  }

  const msg = 'Não foi possível carregar dados (PHP/estático/cache).\n' +
              errors.map((e,i)=>`[${i+1}] ${e.message}`).join('\n');
  throw new Error(msg);
}

// Helpers
function mapInterval(tf){
  if (tf === '1h') return '60m';
  if (tf === '1w') return '1wk';
  return tf;
}
function requestRange(tf){
  if (tf === '1h')  return '3mo';
  if (tf === '1d')  return 'max';
  if (tf === '1w')  return 'max';
  if (tf === '1mo') return 'max';
  return 'max';
}
