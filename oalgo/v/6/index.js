// index.js

let sharedData = Storage.loadData('sharedData') || { steps: [] };

const legoContainer = document.getElementById('legoContainer');
LegoUI.init(legoContainer, sharedData, onLegoChange);

const editor = new JSONEditor(document.getElementById('jsoneditor'), {
  mode: 'tree',
  onChange: onJsonChange
});

let ignoreJsonChange = false;
editor.set(sharedData);

function onLegoChange() {
  Storage.saveData('sharedData', sharedData);
  ignoreJsonChange = true;
  editor.set(sharedData);
  ignoreJsonChange = false;
  OAlgoEngine.run(sharedData);
}

function onJsonChange() {
  if (ignoreJsonChange) return;
  try {
    const json = editor.get();
    sharedData = json;
    LegoUI.update(sharedData);
    Storage.saveData('sharedData', sharedData);
    OAlgoEngine.run(sharedData);
  } catch (e) {
    console.error('JSON inválido, revertendo:', e);
    ignoreJsonChange = true;
    editor.set(sharedData);
    ignoreJsonChange = false;
  }
}
