import express from 'express';
import config from 'config';

import { log } from '@tamanu/shared/services/logging';

import * as fijiVrs from './fiji-vrs';
import * as fijiVps from './fiji-vps';
import * as signer from './Signer';
import * as fijiAspenMediciReport from './fijiAspenMediciReport';
import * as mSupply from './mSupply';
import * as fhir from './fhir';
import * as omniLab from './omniLab';

import { checkEuDccConfig } from './EuDcc';
import { checkSignerConfig } from './Signer';
import { checkVdsNcConfig } from './VdsNc';
import { checkFhirConfig } from './fhir/config';

const integrations = {
  fijiVrs,
  fijiVps,
  signer,
  fijiAspenMediciReport,
  mSupply,
  fhir,
  omniLab,
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
  checkEuDccConfig();
  checkSignerConfig();
  checkVdsNcConfig();
  checkFhirConfig();

  if (
    (config.integrations.euDcc.enabled || config.integrations.vdsNc.enabled) &&
    !config.integrations.signer.enabled
  ) {
    throw new Error('euDcc and vdsNc integrations require the signer integration to be enabled');
  }

  if (config.integrations.euDcc.enabled && config.integrations.vdsNc.enabled) {
    throw new Error('Cannot enable both euDcc and vdsNc integrations at the same time');
  }
}
