import express from 'express';
import { FijiVRSIntegration } from './fiji-vrs';

const integrations = {
  fijiVrs: FijiVRSIntegration,
};

export const integrationRoutes = express.Router();
export const publicIntegrationRoutes = express.Router();

export const initIntegrations = async ctx => {
  for (const [key, integration] of Object.entries(integrations)) {
    await integration.initContext(ctx);
    const publicRoutes = integration.publicRoutes();
    if (publicRoutes) {
      publicIntegrationRoutes.use(`/${key}`, publicRoutes);
    }
    const routes = integration.routes();
    if (routes) {
      integrationRoutes.use(`/${key}`, routes);
    }
  }
};
