import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library only registers its own cleanup when vitest globals are on
afterEach(cleanup);

// jsdom has <dialog> but not its modal methods
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
}

// jsdom does no layout, so there is nothing to scroll
window.scrollTo = () => {};
Element.prototype.scrollTo = () => {};
document.elementFromPoint ??= () => null;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Node's own localStorage shadows jsdom's and is unavailable without a backing file
beforeEach(() => {
  const items = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, String(value)),
    removeItem: (key: string) => items.delete(key),
    clear: () => items.clear(),
  });
});
