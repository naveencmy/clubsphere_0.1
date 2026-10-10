import { createSeed } from './data/seed.js';
const KEY = 'clubsphere-nec-cse-v1';
let state;
const listeners = new Set();
function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const saved = raw && JSON.parse(raw);
    return saved?.version === 1 ? saved : createSeed();
  } catch {
    return createSeed();
  }
}
state = load();
export const store = {
  get: () => state,
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  commit(next) {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(next));
    state = next;
    listeners.forEach((fn) => fn());
  },
  reset() {
    this.commit(createSeed());
  },
  key: KEY,
};
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((fn) => fn());
    }
  });
