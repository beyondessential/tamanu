import express from 'express';
import config from 'config';

import { log } from 'shared/services/logging';

import * as fijiVrs from './fiji-vrs';
import * as fijiVps from './fiji-vps';

const integrations = {
  fijiVrs,
  fijiVps,
};

export const integrationRoutes = express.Router();
export const publicIntegrationRoutes = express.Router();

export const initIntegrations = async ctx => {
  for (const [key, integration] of Object.entries(integrations)) {
    if (config.integrations[key].enabled) {
      log.info(`initIntegrations: ${key}: initialising`);
      const { routes, publicRoutes, initAppContext } = integration;
      if (initAppContext) {
        await initAppContext(ctx);
      }
      if (routes) {
        integrationRoutes.use(`/${key}`, routes);
      }
      if (publicRoutes) {
        publicIntegrationRoutes.use(`/${key}`, publicRoutes);
      }
    } else {
      log.info(`initIntegrations: ${key}: disabled, did not initialise`);
    }
  }
};
