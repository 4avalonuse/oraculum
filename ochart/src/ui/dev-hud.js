// HUD leve com ring buffer e cópia JSONL
const RING_MAX = 500;
const ring = [];
const subs = new Set();

export function pushLog(ev){
  try{
    const row = { ts: Date.now(), level:'info', msg:'', ...ev };
    ring.push(row);
    if(ring.length > RING_MAX) ring.shift();
    subs.forEach(fn => fn(getState()));
  }catch(e){ console.warn('pushLog failed', e); }
}

export function getState(){
  return { ring: ring.slice(-RING_MAX) };
}

export function mountHUD(root){
  root.innerHTML = `
    <div id="hud">
      <div class="hud-bar">
        <button id="hud-toggle">Dev HUD</button>
        <span>Logs:</span>
        <select id="hud-filter">
          <option value="all">all</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
        </select>
        <button id="hud-copy">Copiar JSONL</button>
        <button id="hud-clear">Limpar</button>
      </div>
      <div id="hud-body">
        <pre id="hud-pre"></pre>
      </div>
    </div>
  `;

  const pre = root.querySelector('#hud-pre');
  const body = root.querySelector('#hud-body');
  const filterSel = root.querySelector('#hud-filter');
  const toggleBtn = root.querySelector('#hud-toggle');

  function render(){
    const level = filterSel.value;
    const rows = getState().ring.filter(ev => level === 'all' ? true : ev.level === level);
    pre.textContent = rows.map(ev => JSON.stringify(ev)).join('\\n');
  }

  render();
  subscribe(render);
  toggleBtn.onclick = () => body.classList.toggle('open');
  root.querySelector('#hud-copy').onclick = () => {
    const rows = getState().ring.map(ev => JSON.stringify(ev)).join('\\n');
    navigator.clipboard?.writeText(rows).then(() => console.info('HUD: logs copiados'));
  };
  root.querySelector('#hud-clear').onclick = () => { ring.splice(0, ring.length); render(); };
  filterSel.onchange = render;
  window.__HUD__ = { pushLog, getState };
}

function subscribe(fn){
  subs.add(fn);
  return () => subs.delete(fn);
}
