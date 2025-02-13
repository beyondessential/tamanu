import { log } from './log.js';

export async function initBugsnag(options) {
  const { default: Bugsnag } = await import('@bugsnag/js');
  const BugsnagPluginExpress = await import('@bugsnag/plugin-express');
  Bugsnag.start({
    ...options,
    plugins: [BugsnagPluginExpress],
    onError: function (event) {
      const status = event.originalError?.status;
      if (status && status < 500) {
        event.severity = 'info';
      }
    },
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
