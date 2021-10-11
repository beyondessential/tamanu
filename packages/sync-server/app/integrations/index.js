import express from 'express';
import { fijiRoutes, publicFijiRoutes, initFijiServices } from './fiji';

export const integrationRoutes = express.Router();
integrationRoutes.use('/fiji', fijiRoutes);

export const publicIntegrationRoutes = express.Router();
publicIntegrationRoutes.use('/fiji', publicFijiRoutes);

export const initIntegrationServices = ctx => {
  return { fiji: initFijiServices(ctx) };
};
