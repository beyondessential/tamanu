import config from 'config';

export function withConfig(fn) {
  const inner = function inner(...args) {
    return fn(...args, config);
  };

  inner.overrideConfig = fn;
  return inner;
}
