const KEY = 'oraculum:investigation-selection:v1';

export function createInvestigationStore(storage = globalThis.localStorage) {
  function read() {
    if (!storage) return [];
    try {
      const value = JSON.parse(storage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  function write(ids) {
    if (!storage) return;
    storage.setItem(KEY, JSON.stringify([...new Set(ids)]));
  }

  return {
    load() {
      return read();
    },
    save(ids) {
      write(ids);
      return read();
    },
    add(id) {
      return this.save([...read(), id]);
    },
    remove(id) {
      return this.save(read().filter(item => item !== id));
    },
    clear() {
      return this.save([]);
    }
  };
}
