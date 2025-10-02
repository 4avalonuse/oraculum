// Storage util
export default class Storage {
  static save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  static load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
}
