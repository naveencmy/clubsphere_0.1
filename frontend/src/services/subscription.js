import { store } from './store.js';
export const subscribe = (listener) => store.subscribe(listener);
