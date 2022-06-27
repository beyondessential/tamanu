import morgan from 'morgan'; // logging middleware for http requests

import { COLORS } from './color';
import { log } from './log';

// Middleware for logging http requests
function getStatusColor(status) {
  switch (status && status[0]) {
    case '5':
      return COLORS.red;
    case '4':
      return COLORS.yellow;
    case '3':
      return COLORS.green;
    case '2':
      return COLORS.blue;
    default:
      return COLORS.yellow;
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
  return morgan(httpFormatter, {
    stream: {
      write: message => {
        // strip whitespace (morgan appends a \n, but winston will too!)
        log.http(message.trim());
      },
    },
  });
}
