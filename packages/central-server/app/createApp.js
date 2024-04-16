import bodyParser from 'body-parser';
import compression from 'compression';
import config from 'config';
import defineExpress from 'express';

import { getLoggingMiddleware } from '@tamanu/shared/services/logging';
import { constructPermission } from '@tamanu/shared/permissions/middleware';
import { SERVER_TYPES } from '@tamanu/constants';

import { buildRoutes } from './buildRoutes';
import { authModule } from './auth';
import { publicRoutes } from './publicRoutes';

import { defaultErrorHandler } from './middleware/errorHandler';
import { loadshedder } from './middleware/loadshedder';
import { versionCompatibility } from './middleware/versionCompatibility';

import { version } from './serverInfo';
import { translationRoutes } from './translation';
import { createServer } from 'http';
import { defineWebsocketService } from './services/websocketService';
import { registerWebsocketEvents } from './wsEvents';

function api(ctx) {
  const apiRoutes = defineExpress.Router();
  apiRoutes.use('/public', publicRoutes);
  apiRoutes.use(authModule);
  apiRoutes.use('/translation', translationRoutes);
  apiRoutes.use(constructPermission);
  apiRoutes.use(buildRoutes(ctx));
  return apiRoutes;
}

/**
 * @param {import('./ApplicationContext').ApplicationContext} ctx
 */
export async function createApp(ctx) {
  const { store, emailService, reportSchemaStores } = ctx;

  const express = defineExpress();
  const server = createServer(express);
  const websocketService = defineWebsocketService({ httpServer: server });
  ctx.telegramBotService?.registerWebsocketService(websocketService);
  registerWebsocketEvents({ websocketService, telegramBotService: ctx.telegramBotService });

  let errorMiddleware = null;
  if (config.errors?.enabled) {
    if (config.errors?.type === 'bugsnag') {
      const Bugsnag = await import('@bugsnag/js');
      const middleware = Bugsnag.getPlugin('express');
      express.use(middleware.requestHandler);
      errorMiddleware = middleware.errorHandler;
    }
  }

  express.use(loadshedder());
  express.use(compression());
  express.use(bodyParser.json({ limit: '50mb' }));
  express.use(bodyParser.urlencoded({ extended: true }));

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
    req.store = store;
    req.models = store.models;
    req.emailService = emailService;
    req.reportSchemaStores = reportSchemaStores;
    req.ctx = ctx;
    next();
  });

  express.get('/$', (req, res) => {
    res.send({
      index: true,
    });
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

  return { express, server };
}
