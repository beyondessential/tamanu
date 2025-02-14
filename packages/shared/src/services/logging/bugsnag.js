import { log } from './log.js';

export async function initBugsnag(options) {
  const { default: Bugsnag } = await import('@bugsnag/js');
  const BugsnagPluginExpress = await import('@bugsnag/plugin-express');
  Bugsnag.start({
    ...options,
    plugins: [BugsnagPluginExpress],
    logger: log,
    onError: function (event) {
      if (!options.errorsToDowngrade || !options.errorsToDowngrade.includes(event.originalError?.message)) return;
      event.severity = 'info';
    },
    redactedKeys: options.redactedKeys
      ? options.redactedKeys.map((redact) => {
          if (redact.startsWith('/') && redact.endsWith('/i')) {
            return new RegExp(redact.slice(1, -1), 'i');
          }

          if (redact.startsWith('/') && redact.endsWith('/')) {
            return new RegExp(redact.slice(1, -1));
          }

          return redact;
        })
      : undefined,
  });
}
