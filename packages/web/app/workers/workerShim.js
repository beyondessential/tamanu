// eslint-disable-next-line no-undef
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof DedicatedWorkerGlobalScope) {
  self.global = self;
  self.window = self;
}

if (process.env.NODE_ENV === 'development') {
  const RefreshRuntime = await import('react-refresh');
  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
}
