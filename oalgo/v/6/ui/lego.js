// ui/lego.js
var LegoUI = (function() {
  let container, data, onChange;
  
  function init(cont, initData, changeCallback) {
    container = cont;
    data = initData;
    onChange = changeCallback;

    container.innerHTML = '';
    const header = document.createElement('div');
    header.innerHTML = `
      <h3>Configuração do Algoritmo (LegoUI)</h3>
      <input type="text" id="stepName" placeholder="Nome do passo">
      <input type="number" id="stepValue" placeholder="Valor">
      <button id="addStep">Adicionar Passo</button>
    `;
    container.appendChild(header);

    const list = document.createElement('ul');
    list.id = 'stepsList';
    container.appendChild(list);

    header.querySelector('#addStep').addEventListener('click', function() {
      const nameField = header.querySelector('#stepName');
      const valueField = header.querySelector('#stepValue');
      const name = nameField.value.trim();
      const value = valueField.value;
      if (name) {
        data.steps.push({ name: name, value: value });
        nameField.value = '';
        valueField.value = '';
        renderList();
        onChange();
      }
    });

    renderList();
  }

  function update(newData) {
    data = newData;
    renderList();
  }

  function renderList() {
    const list = container.querySelector('#stepsList');
    list.innerHTML = '';
    data.steps.forEach((step, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <input type="text" class="step-name" value="${step.name}">
        <input type="number" class="step-value" value="${step.value}">
        <button class="remove-step">Remover</button>
      `;
      li.querySelector('.remove-step').addEventListener('click', function() {
        data.steps.splice(index, 1);
        renderList();
        onChange();
      });
      li.querySelector('.step-name').addEventListener('input', function(e) {
        step.name = e.target.value;
        onChange();
      });
      li.querySelector('.step-value').addEventListener('input', function(e) {
        step.value = e.target.value;
        onChange();
      });
      list.appendChild(li);
    });
  }

  return {
    init: init,
    update: update
  };
})();
