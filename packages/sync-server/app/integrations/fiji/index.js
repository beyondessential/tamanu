import express from 'express';
import config from 'config';

import { vrsRoutes } from './vaccineRegistrationSystem';
import { VRSRemote } from './VRSRemote';

export const fijiRoutes = express.Router();
if (config.integrations.fiji.vrs.enabled) {
  fijiRoutes.use('/vrs', vrsRoutes);
}

export const initFijiServices = ctx => {
  const services = {};
  if (config.integrations.fiji.vrs.enabled) {
    services.vrsRemote = new VRSRemote(ctx.store, config.integrations.fiji.vrs);
  }
  return services;
};
