import { log } from '../services/logging/log';

export const namedLog = (severity, name) => (message, data = {}) =>
  log[severity](`${name} - ${message}`, {
    name,
    ...data,
  });

/**
 * Create a custom log function that includes the name to identifying groups of logs
 * i.e function name or endpoint name
 * This is useful as name is defined as the log context identifier in Honeycomb and is core to
 * grouping and creating alerts from logs.
 */
export const createNamedLogger = name => ({
  error: namedLog('error', name),
  info: namedLog('info', name),
});
