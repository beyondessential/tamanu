import winston from 'winston';
import config from 'config';

// defensive destructure to allow for testing shared-src directly
const { path, consoleLevel } = config?.log || {};

export const log = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: path && [
    new winston.transports.File({ filename: `${path}/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${path}/combined.log` }),
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: consoleLevel || 'info',
      silent: !consoleLevel,
    }),
  ],
});
