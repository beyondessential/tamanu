import express from 'express';
import { fijiRoutes, initFijiServices } from './fiji';

export const integrationRoutes = express.Router();
integrationRoutes.use('/fiji', fijiRoutes);

export const initIntegrationServices = ctx => {
  return { fiji: initFijiServices(ctx) };
};
