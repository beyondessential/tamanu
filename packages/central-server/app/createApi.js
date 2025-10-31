import bodyParser from 'body-parser';
import compression from 'compression';
import config from 'config';
import defineExpress from 'express';
import asyncHandler from 'express-async-handler';
import helmet from 'helmet';

import { getLoggingMiddleware, log } from '@tamanu/shared/services/logging';
import { constructPermission } from '@tamanu/shared/permissions/middleware';
import { SERVER_TYPES } from '@tamanu/constants';

import { buildRoutes } from './buildRoutes';
import { authModule } from './auth';
import { publicRoutes } from './publicRoutes';
import { patientPortalApi } from './patientPortalApi';

import { defaultErrorHandler } from './middleware/errorHandler';
import { loadshedder } from './middleware/loadshedder';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from './serverInfo';
import { translationRoutes } from './translation';
import { createServer } from 'http';

import { settingsReaderMiddleware } from '@tamanu/settings/middleware';
import { attachAuditUserToDbSession } from '@tamanu/database/utils/audit';

const rawBodySaver = function (req, res, buf) {
  if (buf && buf.length) {
    req.rawBody = buf;
  }
};

function api(ctx) {
  const apiRoutes = defineExpress.Router();
  apiRoutes.use('/public', publicRoutes);
  apiRoutes.post(
    '/timesync',
    bodyParser.raw({ verify: rawBodySaver, type: '*/*' }),
    asyncHandler(async (req, res) => {
      try {
        const timeRes = await ctx.timesync.answerClient(req.rawBody);
        res.type('application/octet-stream');
        res.send(timeRes);
      } catch (error) {
        log.error('Error in timesync:', error);
        res.status(500).send(error.toString());
      }
    }),
  );
  apiRoutes.use(authModule);
  apiRoutes.use(attachAuditUserToDbSession);
  apiRoutes.use('/translation', translationRoutes);
  apiRoutes.use(constructPermission);
  apiRoutes.use(buildRoutes(ctx));
  return apiRoutes;
}

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApi(ctx) {
  const { store, emailService, reportSchemaStores } = ctx;
  const express = defineExpress();

  let errorMiddleware = null;
  if (config.errors?.enabled) {
    if (config.errors?.type === 'bugsnag') {
      const { default: Bugsnag } = await import('@bugsnag/js');
      const middleware = Bugsnag.getPlugin('express');
      express.use(middleware.requestHandler);
      errorMiddleware = middleware.errorHandler;
    }
  }

  express.use(
    helmet({
      crossOriginEmbedderPolicy: true,
      strictTransportSecurity: false,
    }),
  );
  express.use(loadshedder());
  express.use(compression());
  express.use(bodyParser.json({ verify: rawBodySaver, limit: '50mb' }));
  express.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));

  // trust the x-forwarded-for header from addresses in `config.proxy.trusted`
  express.set('trust proxy', config.proxy.trusted);
  express.use(getLoggingMiddleware());

  express.use((req, res, next) => {
    res.setHeader('X-Tamanu-Server', SERVER_TYPES.CENTRAL);
    res.setHeader('X-Version', version);
    next();
  });

  express.use(versionCompatibility);

  express.use((req, res, next) => {
    req.models = store.models; // cross-compatibility with facility for shared middleware
    req.db = store.sequelize;
    req.store = store;
    req.emailService = emailService;
    req.reportSchemaStores = reportSchemaStores;
    req.ctx = ctx;
    req.language = req.headers['language'];
    next();
  });

  express.use(settingsReaderMiddleware);

  express.get('/$', (req, res) => {
    res.send({
      index: true,
    });
  });

  // Patient Portal - must go before main API to avoid main authentication
  express.use('/api/portal', async (req, res, next) => {
    const patientPortalEnabled = await req.settings.get('features.patientPortal');
    return patientPortalEnabled ? patientPortalApi(req, res, next) : res.status(501).end();
  });

  // API
  express.use('/api', api(ctx));

  // Legacy API endpoint
  express.use('/v1', api(ctx));

  // Dis-allow all other routes
  express.use('*', (req, res) => {
    res.status(404).end();
  });

  if (errorMiddleware) {
    express.use(errorMiddleware);
  }

  express.use(defaultErrorHandler);

  return { express, httpServer: createServer(express) };
}
