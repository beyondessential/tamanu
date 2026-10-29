import { afterEach } from 'vitest';
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
