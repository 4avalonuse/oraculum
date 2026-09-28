import { attachDataLibrary } from '../oraculum/ui/data-library.js';

const root = document.querySelector('#oraculum-data-library');
const selection = document.querySelector('#oraculum-selection');

attachDataLibrary(root, items => {
  if (!selection) return;
  selection.textContent = items.length ? items.map(item => item.label).join(' · ') + ' selecionado(s)' : 'Nenhum dado selecionado. Escolha o que deseja investigar.';
});
