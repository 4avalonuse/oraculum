// C:\4Avalon\projetos\oraculum\src\main.js
import { start } from './router.js';
import { actions, getState, subscribe } from './state/store.js';
import { mountHUD } from './ui/hud.js';
import { mountSettings } from './ui/settings.js';

function applyTheme(theme){
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

let _mq;
function watchAutoTheme(enable){
  if(_mq){ _mq.onchange = null; _mq = null; }
  if(enable){
    _mq = window.matchMedia('(prefers-color-scheme: dark)');
    _mq.onchange = ()=> applyTheme('auto');
  }
}

function boot(){
  // HUD e Settings
  mountHUD(document.getElementById('dev-hud-root'));
  mountSettings(document.getElementById('settings-root'));

  // primeiro log
  actions.pushLog({ level:'info', msg:'boot_ok', ts: Date.now(), data:{ version:'skeleton' } });

  // router
  start(document.getElementById('app'));

  // tema na carga + observar auto
  const st = getState();
  applyTheme(st.app.theme);
  watchAutoTheme(st.app.theme === 'auto');

  // reagir a mudanças de estado
  subscribe((s)=>{
    applyTheme(s.app.theme);
    watchAutoTheme(s.app.theme === 'auto');
  });

  // smoke
  if(!st || !st.app || !st.data) actions.pushLog({level:'error', msg:'smoke_state_invalid', ts: Date.now()});
}

boot();

// abrir settings
document.getElementById('btn-settings')?.addEventListener('click', ()=> {
  actions.toggleSettings(true);
});
