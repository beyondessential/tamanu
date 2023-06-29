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

function getSendTime(res) {
  if (!res._startAt) return null;

  // time elapsed from response headers sent
  const elapsed = process.hrtime(res._startAt);
  const ms = elapsed[0] * 1e3 + elapsed[1] * 1e-6;
  return ms.toFixed(3);
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
    field(req._bytesRead?.toFixed(0), { prefix: 'bytesRecv=' }),
    field(res._bytesWritten?.toFixed(0), { prefix: 'bytesSent=' }),
    field(res.getHeader('content-type')?.match(/\/([\w+]+);?/)?.[1], { prefix: 'contentType=' }),
    field(tokens['response-time'](req, res), { prefix: 'processingTime=', suffix: 'ms' }),
    field(getSendTime(res), { prefix: 'sendTime=', suffix: 'ms' }),
    field(userId?.[userId?.length - 1], { color: COLORS.magenta, prefix: 'user=' }),
  ]
    .filter(Boolean)
    .join(' ');
};

function recordActualBytes(req, res) {
  req._bytesRead = req.socket.bytesRead - req._prevBytesRead;
  res._bytesWritten = req.socket.bytesWritten - res._prevBytesWritten;
  req._prevBytesRead = req.socket.bytesRead;
  res._prevBytesWritten = req.socket.bytesWritten;
}

export function getLoggingMiddleware() {
  const logger = morgan(httpFormatter, {
    stream: {
      write: message => {
        // strip whitespace (morgan appends a \n, but winston will too!)
        log.http(message.trim());
      },
    },
  });

  return (req, res, next) => {
    // record actual bytes read/written from/to socket, without trusting headers
    req._prevBytesRead = 0;
    res._prevBytesWritten = 0;
    res.on('end', () => recordActualBytes(req, res));
    res.on('finish', () => recordActualBytes(req, res));

    logger(req, res, next);
  };
}
