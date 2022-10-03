import config from 'config';

import { fhirRoutes } from '../../hl7fhir';

export const routes = fhirRoutes(config.integrations.fijiVps);
