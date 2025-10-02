// oalgo/core/Storage.js
export default class Storage {
  static save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Saved [${key}]`);
  }

  static load(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("⚠️ Failed to parse storage:", e);
      return null;
    }
  }

  static download(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static upload(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        callback(json);
      } catch (err) {
        console.error("⚠️ Invalid JSON file:", err);
      }
    };
    reader.readAsText(file);
  }
}
