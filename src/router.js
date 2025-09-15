import * as dash from './pages/dashboard/index.js';
import * as bots from './pages/bots/index.js';
import { actions } from './state/store.js';

const routes = {
  '#/dashboard': dash,
  '#/bots': bots
};

let current = null;
function mount(route, root){
  if(current && current.unmount) current.unmount(root);
  const mod = routes[route] || dash;
  current = mod;
  actions.setPage(route in routes ? route.slice(2) : 'dashboard');
  mod.mount(root);
}

export function start(root){
  const go = ()=> mount(location.hash || '#/dashboard', root);
  window.addEventListener('hashchange', go);
  go();
}
