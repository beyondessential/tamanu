import { log } from './log';

/**
 * Create a child logger from winston logger
 * with name prefix and bound extra context params
 * This is useful as it can get verbose and repetitive passing context
 * params to the logger
 *
 * @param {string} name i.e function name or endpoint name *note* this is the primary identifier for the log group
 * @example const reportRunnerLogger = createNamedLogger('ReportRunner');
 * reportRunnerLogger.info('Running report', { reportName }); // => ReportRunner - Running report
 */
export const createNamedLogger = (name, params = {}) =>
  log.child({ name, childLabel: name, ...params });
