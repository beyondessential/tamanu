import winston from 'winston'; // actual log output
import config from 'config';

import { localTransport } from './console';
import { honeycombTransport } from './honeycomb';

// defensive destructure to allow for testing shared directly
const { path } = config?.log || {};

export const log = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    path ? new winston.transports.File({ filename: `${path}/error.log`, level: 'error' }) : null,
    path ? new winston.transports.File({ filename: `${path}/combined.log` }) : null,
    localTransport,
    honeycombTransport,
  ].filter(t => !!t),
});
