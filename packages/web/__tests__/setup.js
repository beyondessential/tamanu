/**
 * jsdom does no layout and ships no ResizeObserver, so components that watch an
 * element's box for changes would throw on render here. Standing one in keeps those
 * components mountable. It never reports a resize, which is the truth in jsdom:
 * nothing is ever laid out, so nothing ever changes size.
 */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
}
