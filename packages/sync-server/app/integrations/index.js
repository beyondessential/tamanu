import express from 'express';
import config from 'config';
import * as fijiVrs from './fiji-vrs';

const integrations = {
  fijiVrs,
};

export const integrationRoutes = express.Router();
export const publicIntegrationRoutes = express.Router();

export const initIntegrations = async ctx => {
  for (const [key, integration] of Object.entries(integrations)) {
    if (config.integrations[key].enabled) {
      const { routes, publicRoutes, initAppContext } = integration;
      await initAppContext(ctx);
      if (routes) {
        integrationRoutes.use(`/${key}`, routes);
      }
      if (publicRoutes) {
        publicIntegrationRoutes.use(`/${key}`, publicRoutes);
      }
    }
  }
};
