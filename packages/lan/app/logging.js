import winston from 'winston';
import config from 'config';

const { logPath } = config;

export const log = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: logPath && [
    new winston.transports.File({ filename: `${logPath}/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${logPath}/combined.log` }),
  ],
});

if (['development'].includes(process.env.NODE_ENV)) {
  log.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: 'debug',
    }),
  );
}

if (['test'].includes(process.env.NODE_ENV)) {
  log.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: 'warn',
    }),
  );
}
