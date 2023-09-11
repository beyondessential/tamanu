import config from 'config';

import { fhirRoutes } from '../../hl7fhir';

// TODO: use db config fetcher
export const routes = ctx => fhirRoutes(ctx, config.integrations.mSupply);
