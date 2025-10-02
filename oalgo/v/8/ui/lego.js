// ui/lego.js — Lego com action/op/value
var LegoUI = (function(){
  let root, data, onChange;
  function init(container, initialData, changeCb){
    root = container; data = initialData; onChange = changeCb; render();
  }
  function update(newData){ data = newData; renderTable(); }
  function render(){
    root.innerHTML = '';
    const controls = document.createElement('div');
    controls.innerHTML = `
      <div style="display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
        <select id="lgAction"><option>BUY</option><option>SELL</option></select>
        <select id="lgOp"><option><</option><option>></option></select>
        <input id="lgValue" type="number" placeholder="valor" step="0.01" style="width:120px;">
        <button id="lgAdd">Adicionar regra</button>
      </div>
      <table id="lgTable" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; border-bottom:1px solid #1f2a44; padding:4px;">Ação</th>
            <th style="text-align:left; border-bottom:1px solid #1f2a44; padding:4px;">Operador</th>
            <th style="text-align:left; border-bottom:1px solid #1f2a44; padding:4px;">Valor</th>
            <th style="border-bottom:1px solid #1f2a44;"></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    root.appendChild(controls);
    controls.querySelector('#lgAdd').onclick = () => {
      const action = controls.querySelector('#lgAction').value;
      const op = controls.querySelector('#lgOp').value;
      const value = Number(controls.querySelector('#lgValue').value);
      if (Number.isFinite(value)){
        data.steps.push({ action, op, value });
        controls.querySelector('#lgValue').value = '';
        renderTable(); onChange();
      }
    };
    renderTable();
  }
  function renderTable(){
    const tbody = root.querySelector('#lgTable tbody'); if (!tbody) return;
    tbody.innerHTML = '';
    (data.steps || []).forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:6px 4px;">${r.action}</td>
        <td style="padding:6px 4px;">${r.op}</td>
        <td style="padding:6px 4px;">${r.value}</td>
        <td style="padding:6px 4px; text-align:right;"><button data-i="${idx}" class="del">Remover</button></td>
      `;
      tr.querySelector('.del').onclick = (e) => {
        const i = Number(e.currentTarget.getAttribute('data-i'));
        data.steps.splice(i,1); renderTable(); onChange();
      };
      tbody.appendChild(tr);
    });
  }
  return { init, update };
})();
