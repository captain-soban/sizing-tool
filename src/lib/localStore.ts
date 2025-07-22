import { writable } from 'svelte/store';

export function localStore<T>(key: string, initial: T) {
  let data: T;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(key);
    try {
      data = stored ? JSON.parse(stored) : initial;
    } catch {
      data = initial;
    }
  } else {
    data = initial;
  }
  
  const store = writable(data);
  
  // Subscribe to changes and save to localStorage (skip initial value)
  let isInitial = true;
  store.subscribe((value) => {
    if (isInitial) {
      isInitial = false;
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
  
  return store;
}
