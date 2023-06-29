import config from 'config';

import { fhirRoutes } from '../../hl7fhir';

export const routes = ctx => fhirRoutes(ctx, config.integrations.mSupply);
