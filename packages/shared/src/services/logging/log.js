import winston from 'winston'; // actual log output

import { localTransport } from './console';

// Directory for error.log / combined.log file transports; unset = no file logging.
const path = process.env.LOG_PATH;

export const log = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    path ? new winston.transports.File({ filename: `${path}/error.log`, level: 'error' }) : null,
    path ? new winston.transports.File({ filename: `${path}/combined.log` }) : null,
    localTransport,
  ].filter(t => !!t),
});
