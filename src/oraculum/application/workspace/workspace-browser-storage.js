const DEFAULT_KEY = 'oraculum:workspaces:v1';

export function createWorkspaceBrowserStorage(key = DEFAULT_KEY) {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('Browser localStorage is not available.');
  }

  return Object.freeze({
    getItem(name = key) {
      return window.localStorage.getItem(name);
    },
    setItem(name = key, value) {
      window.localStorage.setItem(name, value);
    }
  });
}
