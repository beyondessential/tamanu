import express from 'express';
import config from 'config';

import { log } from '@tamanu/shared/services/logging';

import * as fijiVrs from './fiji-vrs';
import * as fijiVps from './fiji-vps';
import * as fijiAspenMediciReport from './fijiAspenMediciReport';
import * as mSupply from './mSupply';
import * as fhir from './fhir';

import { checkFhirConfig } from './fhir/config';

const integrations = {
  fijiVrs,
  fijiVps,
  fijiAspenMediciReport,
  mSupply,
  fhir,
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
        const isRouter = Object.getPrototypeOf(routes) === express.Router;
        const actualRoutes = isRouter ? routes : routes(ctx);
        integrationRoutes.use(`/${key}`, actualRoutes);
      }
      if (publicRoutes) {
        publicIntegrationRoutes.use(`/${key}`, publicRoutes);
      }
    } else {
      log.info(`initIntegrations: ${key}: disabled, did not initialise`);
    }
  }
};

export function checkIntegrationsConfig() {
  checkFhirConfig();
}
