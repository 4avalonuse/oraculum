import { getState, subscribe, actions } from '../state/store.js';

export function mountHUD(root){
  root.innerHTML = `
    <div id="hud" class="fixed bottom-0 left-0 right-0 bg-white/95 border-t shadow-sm text-xs z-40">
      <div class="mx-auto max-w-6xl p-2 flex items-center gap-2 flex-wrap">
        <button id="hud-toggle" class="px-2 py-1 border rounded">Dev HUD</button>
        <span class="text-gray-500">Logs:</span>
        <select id="hud-filter" class="border rounded px-1 py-0.5">
          <option value="all">all</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="error">error</option>
        </select>
        <button id="hud-copy" class="px-2 py-1 border rounded">Copiar JSONL</button>
        <button id="hud-clear" class="px-2 py-1 border rounded">Limpar</button>
      </div>
      <div id="hud-body" class="hidden max-h-48 overflow-auto border-t">
        <pre class="p-2 whitespace-pre-wrap" id="hud-pre"></pre>
      </div>
    </div>
  `;

  const pre = root.querySelector('#hud-pre');
  const body = root.querySelector('#hud-body');
  const filterSel = root.querySelector('#hud-filter');
  const toggleBtn = root.querySelector('#hud-toggle');

  function render(){
    const s = getState();
    const level = filterSel.value;
    const rows = s.logs.ring.filter(ev => level==='all' ? true : ev.level===level);
    pre.textContent = rows.map(ev => JSON.stringify(ev)).join('\n');
    body.classList.toggle('hidden', !s.ui.devHudVisible);
  }
  render();
  const off = subscribe(render);

  toggleBtn.onclick = ()=> actions.toggleDevHud();
  root.querySelector('#hud-copy').onclick = ()=>{
    const s = getState();
    const rows = s.logs.ring.map(ev => JSON.stringify(ev)).join('\n');
    navigator.clipboard.writeText(rows).then(()=> actions.toast('Logs copiados'));
  };
  root.querySelector('#hud-clear').onclick = ()=> actions.clearLogs();
  filterSel.onchange = render;

  root._unmount = off;
}
export function unmount(root){ root?._unmount?.(); }
