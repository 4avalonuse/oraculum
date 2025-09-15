// C:\4Avalon\projetos\oraculum\src\ui\settings.js
import { getState, subscribe, actions } from '../state/store.js';

// utils
function secFromHMS(h,m,s){
  const H = parseInt(h||0,10), M = parseInt(m||0,10), S = parseInt(s||0,10);
  return Math.max(0, H*3600 + M*60 + S);
}
function hmsFromSec(total){
  const t = Math.max(0, parseInt(total||0,10));
  const H = Math.floor(t/3600);
  const M = Math.floor((t%3600)/60);
  const S = t%60;
  return {H,M,S};
}

export function mountSettings(root){
  root.innerHTML = `
    <div id="settings-panel" class="bg-white border-l shadow-xl"
         style="position:fixed; top:0; right:0; width:380px; height:100vh; overflow-y:auto; -webkit-overflow-scrolling:touch; padding-bottom:1rem; transform: translateX(100%); transition: transform .2s ease; z-index:100;">

      <div class="p-4 border-b flex items-center justify-between">
        <h3 class="font-semibold text-lg">Settings</h3>
        <button id="settings-close" class="text-sm px-3 py-1 border rounded hover:bg-gray-50">Fechar</button>
      </div>

      <div class="p-4 space-y-6 overflow-auto h-[calc(100%-56px)]">
        <!-- Linha 1: Visual + Modo (toggles únicos) -->
        <section class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs text-gray-500 mb-1">Visual</div>
            <button id="theme-toggle" class="px-2 py-1 border rounded w-full">—</button>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">Modo</div>
            <button id="mode-toggle" class="px-2 py-1 border rounded w-full">—</button>
          </div>
        </section>

        <!-- Linha 2: Timeframe + Dev HUD + Avançado (mesma linha) -->
        <section class="flex items-end justify-between gap-4 flex-wrap">
          <div class="flex flex-col gap-2">
            <div class="text-xs text-gray-500">Timeframe padrão</div>
            <div class="flex gap-2">
              <button data-tf="1h"  class="tf-btn px-2 py-1 border rounded">1h</button>
              <button data-tf="1d"  class="tf-btn px-2 py-1 border rounded">1d</button>
              <button data-tf="1w"  class="tf-btn px-2 py-1 border rounded">1w</button>
              <button data-tf="1mo" class="tf-btn px-2 py-1 border rounded">1mo</button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="show-hud" class="px-2 py-1 border rounded">Alternar Dev HUD</button>
            <span class="px-3 py-1 border rounded text-red-600 border-red-300">Modo avançado (em breve)</span>
          </div>
        </section>



        <!-- Linha 3: Bots + Auto refresh -->
        <section class="space-y-2">
          <div class="text-sm font-medium">Bots</div>
          <label class="flex items-center gap-2">
            <input id="chk-bots" type="checkbox" class="accent-black">
            <span>Ativar TODOS os bots</span>
          </label>
          <p class="text-xs text-gray-500">Ao desativar, todos os bots param. Será solicitada confirmação.</p>
        </section>

        <section class="grid grid-cols-3 gap-2 items-end">
          <div class="text-xs text-gray-500 col-span-3">Atualização automática</div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">H</label>
            <input id="ref-h" type="number" min="0" class="w-full border rounded px-2 py-1" value="0">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">M</label>
            <input id="ref-m" type="number" min="0" class="w-full border rounded px-2 py-1" value="0">
          </div>
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <label class="block text-xs text-gray-500 mb-1">S</label>
              <input id="ref-s" type="number" min="0" class="w-full border rounded px-2 py-1" value="0">
            </div>
            <button id="ref-apply" class="px-3 py-1 border rounded">Aplicar</button>
          </div>
          <div class="col-span-3 text-xs text-gray-500" id="ref-status">Atual: off</div>
        </section>

        <!-- Linha 4: Widgets -->
        <section class="space-y-2">
          <div class="text-sm font-medium">Widgets visíveis (Dashboard)</div>
          <label class="flex items-center gap-2"><input id="w-price"  type="checkbox" class="accent-black">Preço</label>
          <label class="flex items-center gap-2"><input id="w-kpis"   type="checkbox" class="accent-black">KPIs</label>
          <label class="flex items-center gap-2"><input id="w-chart"  type="checkbox" class="accent-black">Gráfico</label>
          <label class="flex items-center gap-2"><input id="w-table"  type="checkbox" class="accent-black">Tabela</label>
        </section>

        <!-- Linha 5: Regras globais -->
        <section class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium">Auto-venda / Lucro (regras globais)</div>
            <label class="flex items-center gap-2">
              <input id="rules-enabled" type="checkbox" class="accent-black">
              <span>Habilitar</span>
            </label>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Take Profit %</label>
              <input id="rules-tp" type="number" class="w-full border rounded px-2 py-1" value="10">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Stop Loss %</label>
              <input id="rules-sl" type="number" class="w-full border rounded px-2 py-1" value="5">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Trailing % (opt)</label>
              <input id="rules-tr" type="number" class="w-full border rounded px-2 py-1" value="0">
            </div>
          </div>
        </section>

        <!-- Linha 6: APIs (placeholder em vermelho) -->
        <section class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-red-600">APIs & credenciais</div>
            <button class="px-3 py-1 border rounded text-red-600 border-red-300 cursor-not-allowed" title="Em breve" disabled>
              Gerenciar
            </button>
          </div>
          <p class="text-xs text-red-600/80">Área em desenvolvimento. Em breve: chaves por exchange, escopos e validação.</p>
        </section>
      </div>
    </div>
  `;

  const panel = root.querySelector('#settings-panel');
  const btnSettings = document.getElementById('btn-settings');
  const btnClose = root.querySelector('#settings-close');

  // estado inicial: fechado
  panel.setAttribute('inert', '');

  function open(v){
    if(v){
      panel.style.transform = 'translateX(0%)';
      panel.removeAttribute('inert');
    }else{
      panel.style.transform = 'translateX(100%)';
      panel.setAttribute('inert','');
    }
  }

  btnSettings?.addEventListener('click', ()=> open(true));
  btnClose?.addEventListener('click', ()=> open(false));
  window.addEventListener('oraculum:settings', (e)=> open(!!e.detail?.open));

  // refs
  const els = {
    themeToggle: root.querySelector('#theme-toggle'),
    modeToggle:  root.querySelector('#mode-toggle'),
    tf:          root.querySelectorAll('.tf-btn'),
    showHud:     root.querySelector('#show-hud'),
    adv:         root.querySelector('#btn-advanced'),
    // bots
    botsAll: root.querySelector('#chk-bots'),
    // refresh
    rH: root.querySelector('#ref-h'),
    rM: root.querySelector('#ref-m'),
    rS: root.querySelector('#ref-s'),
    rApply: root.querySelector('#ref-apply'),
    rStatus: root.querySelector('#ref-status'),
    // widgets
    wPrice: root.querySelector('#w-price'),
    wKpis:  root.querySelector('#w-kpis'),
    wChart: root.querySelector('#w-chart'),
    wTable: root.querySelector('#w-table'),
    // rules
    rEnabled: root.querySelector('#rules-enabled'),
    rTp: root.querySelector('#rules-tp'),
    rSl: root.querySelector('#rules-sl'),
    rTr: root.querySelector('#rules-tr'),
  };

  // sync visual
  function sync(){
    const s = getState();
    const ss = s.settings ?? {
      bots: { allEnabled:false },
      autoRefresh: 0,
      widgets: { price:true, kpis:true, chart:true, table:true },
      rules: { enabled:false, tp:10, sl:5, trailing:0 }
    };

    // THEME toggle (considera 'auto' como o estado do sistema)
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = s.app.theme === 'dark' || (s.app.theme === 'auto' && systemDark);
    if(els.themeToggle){
      els.themeToggle.textContent = isDark ? 'Escuro' : 'Claro';
      els.themeToggle.classList.toggle('bg-black', isDark);
      els.themeToggle.classList.toggle('text-white', isDark);
    }

    // MODE toggle
    const isReal = s.app.mode === 'real';
    if(els.modeToggle){
      els.modeToggle.textContent = isReal ? 'Real' : 'Simulado';
      els.modeToggle.classList.toggle('bg-black', isReal);
      els.modeToggle.classList.toggle('text-white', isReal);
    }

    // timeframe
    els.tf.forEach(b=>{
      const on = b.dataset.tf === s.data.timeframe;
      b.classList.toggle('bg-black', on);
      b.classList.toggle('text-white', on);
    });

    // bots
    els.botsAll.checked = !!ss.bots.allEnabled;

    // refresh
    const {H,M,S} = hmsFromSec(ss.autoRefresh);
    els.rH.value = H; els.rM.value = M; els.rS.value = S;
    els.rStatus.textContent = ss.autoRefresh ? `Atual: ${H}h ${M}m ${S}s` : 'Atual: off';

    // widgets
    els.wPrice.checked = !!ss.widgets.price;
    els.wKpis.checked  = !!ss.widgets.kpis;
    els.wChart.checked = !!ss.widgets.chart;
    els.wTable.checked = !!ss.widgets.table;

    // rules
    els.rEnabled.checked = !!ss.rules.enabled;
    els.rTp.value = ss.rules.tp ?? 10;
    els.rSl.value = ss.rules.sl ?? 5;
    els.rTr.value = ss.rules.trailing ?? 0;

    const disabled = !els.rEnabled.checked;
    [els.rTp, els.rSl, els.rTr].forEach(input=>{
      input.toggleAttribute('disabled', disabled);
      input.classList.toggle('opacity-50', disabled);
      input.classList.toggle('cursor-not-allowed', disabled);
    });
  }
  sync();
  const off = subscribe(sync);

  // handlers
  els.themeToggle?.addEventListener('click', ()=>{
    const s = getState();
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = s.app.theme === 'dark' || (s.app.theme === 'auto' && systemDark);
    actions.setTheme(isDark ? 'light' : 'dark');
  });

  els.modeToggle?.addEventListener('click', ()=>{
    const s = getState();
    actions.setMode(s.app.mode === 'real' ? 'simulation' : 'real');
  });

  els.tf.forEach(b=> b.addEventListener('click', ()=> actions.setTimeframe(b.dataset.tf)));
  els.showHud?.addEventListener('click', ()=> actions.toggleDevHud());
  els.adv?.addEventListener('click', ()=> actions.toast('Modo avançado: em breve'));

  els.botsAll.addEventListener('change', ()=>{
    const want = !!els.botsAll.checked;
    if(!want){
      const ok = confirm('Desativar TODOS os bots? Eles serão parados.');
      if(!ok){ els.botsAll.checked = true; return; }
    }
    actions.setBotsAllEnabled(want);
  });

  els.rApply.addEventListener('click', ()=>{
    const sec = secFromHMS(els.rH.value, els.rM.value, els.rS.value);
    actions.setAutoRefresh(sec);
  });

  // widgets
  els.wPrice.addEventListener('change', ()=> actions.setWidgets({price: !!els.wPrice.checked}));
  els.wKpis.addEventListener('change',  ()=> actions.setWidgets({kpis:  !!els.wKpis.checked}));
  els.wChart.addEventListener('change', ()=> actions.setWidgets({chart: !!els.wChart.checked}));
  els.wTable.addEventListener('change', ()=> actions.setWidgets({table: !!els.wTable.checked}));

  // rules
  els.rEnabled.addEventListener('change', ()=> actions.toggleRulesEnabled(!!els.rEnabled.checked));
  els.rTp.addEventListener('change', ()=> actions.setRules({ tp: parseFloat(els.rTp.value||0) }));
  els.rSl.addEventListener('change', ()=> actions.setRules({ sl: parseFloat(els.rSl.value||0) }));
  els.rTr.addEventListener('change', ()=> actions.setRules({ trailing: parseFloat(els.rTr.value||0) }));

  root._unmount = off;
}
export function unmount(root){ root?._unmount?.(); }
