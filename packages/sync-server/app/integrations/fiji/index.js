import express from 'express';
import config from 'config';

import { vrsRoutes, publicVrsRoutes, VRSRemote } from './vrs';

export const fijiRoutes = express.Router();
export const publicFijiRoutes = express.Router();

if (config.integrations.fiji.vrs.enabled) {
  fijiRoutes.use('/vrs', vrsRoutes);
  publicFijiRoutes.use('/vrs', publicVrsRoutes);
}

export const initFijiServices = ctx => {
  const services = {};
  if (config.integrations.fiji.vrs.enabled) {
    services.vrsRemote = new VRSRemote(ctx.store, config.integrations.fiji.vrs);
  }
  return services;
};
