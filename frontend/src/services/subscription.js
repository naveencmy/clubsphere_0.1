import { store } from '../mock/mockStore.js';
export const subscribe = (listener) => store.subscribe(listener);
