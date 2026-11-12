import { useSyncExternalStore } from 'react';

// System errors (relegated, unclassified server errors — see specs/platform/system-errors.md)
// live here rather than in redux because their producer is the API error handler wired at
// bootstrap in index.js, outside the React tree.
//
// The list is in-memory and session-scoped: it is naturally lost on a page reload (module
// memory), and is explicitly cleared on the auth lifecycle (login/logout) by a redux
// middleware in store/initStore.js, matching the behaviour of the old redux slice.

// spec: SYSERR#retention
export const SYSTEM_ERROR_RETENTION_MS = 24 * 60 * 60 * 1000;

let errors = [];
const listeners = new Set();

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = listener => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Returns the current array by reference: useSyncExternalStore requires a stable snapshot
// between renders, and `errors` only changes identity when a mutator below replaces it.
const getSnapshot = () => errors;

export const systemErrorStore = {
  subscribe,
  getSnapshot,
  add(error) {
    errors = [...errors, { ...error, isRead: false }];
    emit();
  },
  markAllRead() {
    errors = errors.map(error => ({ ...error, isRead: true }));
    emit();
  },
  remove(ids) {
    errors = errors.filter(error => !ids.includes(error.id));
    emit();
  },
  // spec: SYSERR#retention
  purgeStale(now = Date.now()) {
    errors = errors.filter(
      error => now - new Date(error.timestamp).getTime() < SYSTEM_ERROR_RETENTION_MS,
    );
    emit();
  },
  clear() {
    errors = [];
    emit();
  },
};

export const useSystemErrors = () =>
  useSyncExternalStore(systemErrorStore.subscribe, systemErrorStore.getSnapshot);
