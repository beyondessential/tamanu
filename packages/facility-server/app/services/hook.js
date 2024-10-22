// @ts-check
import { createHooks } from 'hookable';
const hooks = createHooks();
/**
 *
 * @param {string} hookName
 */
export const defineHook = hookName => {
  const on = func => hooks.hook(hookName, func);
  const trigger = () => hooks.callHook(hookName);
  return {
    on,
    trigger,
  };
};
