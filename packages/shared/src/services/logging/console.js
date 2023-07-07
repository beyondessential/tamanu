import winston from 'winston'; // actual log output
import config from 'config';

import { COLORS } from './color';

// defensive destructure to allow for testing shared directly
const { consoleLevel } = config?.log || {};

// additional parameters to log.info etc will be serialised and logged using this formatter
const additionalDataFormatter = (obj = {}) => {
  if (typeof obj !== 'object') {
    return `${obj}`;
  }

  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
};

// formatter for all logging:
// 2022-03-25T06:52:30.003Z info: My console message! additionalItem=additionalValue
const logFormat = winston.format.printf(({ level, message, childLabel, timestamp, ...rest }) => {
  const restString = additionalDataFormatter(rest);
  if (restString === '') {
    return `${COLORS.grey(timestamp)} ${level}: ${childLabel ? `${childLabel} - ` : ''}${message}`;
  }

  return `${COLORS.grey(timestamp)} ${level}: ${message} ${COLORS.grey(restString)}`;
});

export const localTransport = new winston.transports.Console({
  format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), logFormat),
  level: consoleLevel || 'info',
  silent: !consoleLevel,
});
