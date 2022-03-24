import winston from 'winston'; // actual log output
import morgan from 'morgan'; // logging middleware for http requests
import config from 'config';
import chalk from 'chalk';

// defensive destructure to allow for testing shared-src directly
const {
  path,
  consoleLevel,
} = config?.log || {};

const COLORS = {
  grey: chalk.hex('999'),
  green: chalk.hex('8ae234'),
  blue: chalk.hex('729fcf'),
  red: chalk.hex('ef2929'),
  yellow: chalk.hex('e9b96e'),
};

const logFormat = winston.format.printf(({ level, message, timestamp, ...rest }) => {
  const restString = JSON.stringify(rest);
  if (restString === '{}') {
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
        write: message => log.info(message),
      },
    }
  );
}