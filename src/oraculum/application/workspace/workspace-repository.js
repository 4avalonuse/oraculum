export function createWorkspaceRepository(storage, { key = 'oraculum:workspaces:v1' } = {}) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('Workspace repository requires a storage adapter.');
  }

  function readAll() {
    const raw = storage.getItem(key);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeAll(workspaces) {
    storage.setItem(key, JSON.stringify(workspaces));
  }

  return Object.freeze({
    load(id) {
      if (!id) return null;
      return readAll()[id] ?? null;
    },
    list() {
      return Object.values(readAll());
    },
    save(workspace) {
      if (!workspace || !workspace.id) throw new Error('Workspace with id is required.');
      const all = readAll();
      all[workspace.id] = workspace;
      writeAll(all);
      return workspace;
    },
    remove(id) {
      if (!id) return false;
      const all = readAll();
      if (!(id in all)) return false;
      delete all[id];
      writeAll(all);
      return true;
    }
  });
}
