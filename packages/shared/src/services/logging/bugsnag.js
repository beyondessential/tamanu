import config from 'config';
import { omit } from 'es-toolkit/compat';

import { log } from './log.js';

export function getBugsnagOptions() {
  const errors = config.errors ?? {};
  const apiKey = process.env.BUGSNAG_API_KEY;
  if (!apiKey && !(errors.enabled && errors.type === 'bugsnag')) return null;
  return { ...omit(errors, ['enabled', 'type']), apiKey: apiKey || errors.apiKey };
}

export async function initBugsnag(options) {
  const { default: Bugsnag } = await import('@bugsnag/js');
  const BugsnagPluginExpress = await import('@bugsnag/plugin-express');
  Bugsnag.start({
    ...options,
    plugins: [BugsnagPluginExpress],
    logger: log,
    redactedKeys: options.redactedKeys ? options.redactedKeys.map(redact => {
      if (redact.startsWith('/') && redact.endsWith('/i')) {
        return new RegExp(redact.slice(1, -1), 'i');
      }

      if (redact.startsWith('/') && redact.endsWith('/')) {
        return new RegExp(redact.slice(1, -1));
      }

      return redact;
    }) : undefined,
  });
}
