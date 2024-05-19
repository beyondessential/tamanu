import { log } from './log.js';

export async function initBugsnag(options) {
  const Bugsnag = await import('@bugsnag/js');
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
