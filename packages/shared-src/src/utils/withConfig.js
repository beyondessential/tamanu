import config from 'config';

/** To be used against functions only (drops the this context) */
export function withConfig(fn) {
  const inner = function inner(...args) {
    return fn(...args, config);
  };

  inner.overrideConfig = fn;
  return inner;
}
