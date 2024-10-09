import bodyParser from 'body-parser';
import compression from 'compression';
import config from 'config';

import { SERVER_TYPES } from '@tamanu/constants';
import { getLoggingMiddleware } from '@tamanu/shared/services/logging';

import { version } from './serverInfo';

export const addFacilityMiddleware = async express => {
  express.use(compression());
  express.use(bodyParser.json({ limit: '50mb' }));
  express.use(bodyParser.urlencoded({ extended: true }));

  express.use((_req, res, next) => {
    res.setHeader('X-Tamanu-Server', SERVER_TYPES.FACILITY);
    res.setHeader('X-Version', version);
    next();
  });

  // trust the x-forwarded-for header from addresses in `config.proxy.trusted`
  express.set('trust proxy', config.proxy.trusted);
  express.use(getLoggingMiddleware());

  let errorMiddleware = null;
  if (config.errors?.enabled) {
    if (config.errors?.type === 'bugsnag') {
      const { default: Bugsnag } = await import('@bugsnag/js');
      const middleware = Bugsnag.getPlugin('express');
      express.use(middleware.requestHandler);
      errorMiddleware = middleware.errorHandler;
    }
  }

  return { errorMiddleware }
};
