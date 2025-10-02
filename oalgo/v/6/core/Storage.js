// core/Storage.js
var Storage = {
  saveData: function(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar localStorage:', e);
    }
  },
  loadData: function(key) {
    try {
      const json = localStorage.getItem(key);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Erro ao carregar localStorage:', e);
      return null;
    }
  }
};
