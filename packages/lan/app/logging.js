import winston from 'winston';

export const log = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (['debug'].includes(process.env.NODE_ENV)) {
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
