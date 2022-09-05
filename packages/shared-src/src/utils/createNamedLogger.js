import { log } from '../services/logging/log';

export const namedLog = (severity, name) => (message, data = {}) =>
  log[severity](`${name} - ${message}`, {
    name,
    ...data,
  });

export const createNamedLogger = name => ({
  error: namedLog('error', name),
  info: namedLog('info', name),
});
