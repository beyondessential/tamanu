import morgan from 'morgan'; // logging middleware for http requests

import { COLORS } from './color';
import { log } from './log';

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

function field(str, { prefix = '', suffix = '', color = String } = {}) {
  if (!str?.length) return null;
  return `${prefix}${color(`${str}${suffix}`)}`;
}

const httpFormatter = (tokens, req, res) => {
  const status = tokens.status(req, res);
  const userId = req.user?.id?.split('-');

  return [
    field(tokens['remote-addr'](req, res), { color: COLORS.grey }),
    field(tokens.method(req, res), {
      color: req.method === 'GET' ? COLORS.green : COLORS.yellow,
    }),
    field(tokens.url(req, res)),
    '-', // separator for named fields
    field(status, { color: getStatusColor(status), prefix: 'status=' }),
    field(tokens['response-time'](req, res), { prefix: 'time-proc=', suffix: 'ms' }),
    field(userId?.[userId?.length - 1], { color: COLORS.magenta, prefix: 'user=' }),
  ]
    .filter(Boolean)
    .join(' ');
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
