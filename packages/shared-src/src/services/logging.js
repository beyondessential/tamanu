import winston from 'winston'; // actual log output
import morgan from 'morgan'; // logging middleware for http requests
import config from 'config';
import chalk from 'chalk';

// defensive destructure to allow for testing shared-src directly
const {
  path,
  consoleLevel,
  color,
} = config?.log || {};

const colorise = color 
  ? (hex) => chalk.hex(hex) 
  : (ignoredHex) => (text => text);

const COLORS = {
  grey: colorise('999'),
  green: colorise('8ae234'),
  blue: colorise('729fcf'),
  red: colorise('ef2929'),
  yellow: colorise('e9b96e'),
};

// additional parameters to log.info etc will be serialised and logged using this formatter
const additionalDataFormatter = (obj = {}) => {
  if (typeof obj !== "object") {
    return `${obj}`;
  }
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
}

// formatter for all logging:
// 2022-03-25T06:52:30.003Z info: My console message! additionalItem=additionalValue
const logFormat = winston.format.printf(({ level, message, timestamp, ...rest }) => {
  const restString = additionalDataFormatter(rest);
  if (restString === '') {
    return `${COLORS.grey(timestamp)} ${level}: ${message}`;
  } else {
    return `${COLORS.grey(timestamp)} ${level}: ${message} ${COLORS.grey(restString)}`;
  }
});

export const log = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    path ? new winston.transports.File({ filename: `${path}/error.log`, level: 'error' }) : null,
    path ? new winston.transports.File({ filename: `${path}/combined.log` }) : null,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), 
        winston.format.timestamp(),
        logFormat,
      ),
      level: consoleLevel || 'info',
      silent: !consoleLevel,
    }),
  ].filter(t => !!t),
});

// Middleware for logging http requests 
function getStatusColor(status) {
  switch(status[0]) {
    case '5': return COLORS.red;
    case '4': return COLORS.yellow;
    case '3': return COLORS.green;
    case '2': return COLORS.blue;
    default: return COLORS.yellow;
  }
}

const httpFormatter = (tokens, req, res) => {
  const methodColor = req.method === 'GET' ? COLORS.green : COLORS.yellow;
  const status = tokens.status(req, res);
  const statusColor = getStatusColor(status);
  return [
    COLORS.grey(tokens['remote-addr'](req, res)),
    methodColor(tokens.method(req, res)),
    tokens.url(req, res),
    statusColor(status),
    res['content-length'],
    '-',
    tokens['response-time'](req, res),
    'ms',
  ].join(' ');
};

export function getLoggingMiddleware() {
  return morgan(
    httpFormatter,
    {
      stream: {
        write: message => {
          // strip whitespace (morgan appends a \n, but winston will too!)
          log.info(message.trim());
        }
      },
    }
  );
}