import config from 'config';

/** To be used against functions only (drops the this context) */
export function withConfig(fn) {
  const inner = function inner(...args) {
    return fn(...args, config);
  };

  inner.overrideConfig = fn;
  return inner;
}

/** Injects a .config static property into the class, use as a decorator */
export function injectConfig(value, { kind }) {
  if (kind !== 'class') {
    throw new Error('injectConfig can only be used on classes');
  }

  return class extends value {
    static config = config;

    static overrideConfig(override) {
      this.config = override;
    }

    static restoreConfig() {
      this.config = config;
    }
  };
}
