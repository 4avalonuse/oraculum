// core/Storage.js
var Storage = {
  saveData: function(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.error('localStorage save error:', e); }
  },
  loadData: function(key) {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      console.error('localStorage load error:', e);
      return null;
    }
  }
};
