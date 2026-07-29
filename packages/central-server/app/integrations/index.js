import express from 'express';

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

const isExpressRouter = routeCandidate =>
  !!routeCandidate &&
  typeof routeCandidate === 'function' &&
  typeof routeCandidate.use === 'function' &&
  typeof routeCandidate.handle === 'function' &&
  Array.isArray(routeCandidate.stack);

export const initIntegrations = async ctx => {
  // FHIR's flag sits with the rest of the FHIR settings rather than under `integrations`.
  const integrationSettings = await ctx.settings.get('integrations');
  const enabledFlags = { ...integrationSettings, fhir: await ctx.settings.get('fhir') };

  for (const [key, integration] of Object.entries(integrations)) {
    if (enabledFlags[key]?.enabled) {
      log.info(`initIntegrations: ${key}: initialising`);
      const { routes, publicRoutes, initAppContext } = integration;
      if (initAppContext) {
        await initAppContext(ctx);
      }
      if (routes) {
        const isRouter = isExpressRouter(routes);
        const actualRoutes = isRouter ? routes : await routes(ctx);
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

export async function checkIntegrationsConfig(settings) {
  await checkFhirConfig(settings);
}
