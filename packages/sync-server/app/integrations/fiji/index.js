import express from 'express';
import config from 'config';

import { vrsRoutes, publicVrsRoutes, VRSRemote } from './vrs';

const isVRSEnabled = !!config.integrations.fiji.vrs.enabled;

export const fijiRoutes = express.Router();
export const publicFijiRoutes = express.Router();

if (isVRSEnabled) {
  fijiRoutes.use('/vrs', vrsRoutes);
  publicFijiRoutes.use('/vrs', publicVrsRoutes);
}

export const initFijiServices = ctx => {
  const services = {};
  if (isVRSEnabled) {
    services.vrsRemote = new VRSRemote(ctx.store, config.integrations.fiji.vrs);
  }
  return services;
};
