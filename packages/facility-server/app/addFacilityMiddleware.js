import bodyParser from 'body-parser';
import compression from 'compression';

import { SERVER_TYPES } from '@tamanu/constants';
import { getLoggingMiddleware } from '@tamanu/shared/services/logging';
import { getTrustedProxy } from '@tamanu/shared/utils';
import { version } from './serverInfo';

export const addFacilityMiddleware = express => {
  express.use(compression());
  express.use(bodyParser.json({ limit: '50mb' }));
  express.use(bodyParser.urlencoded({ extended: true }));

  express.use((_req, res, next) => {
    res.setHeader('X-Tamanu-Server', SERVER_TYPES.FACILITY);
    res.setHeader('X-Version', version);
    next();
  });

  // trust the x-forwarded-for header from proxies in the PROXY_TRUSTED env var
  // (comma-separated list; defaults to `loopback` for a local reverse proxy)
  express.set('trust proxy', getTrustedProxy());
  express.use(getLoggingMiddleware());
};
