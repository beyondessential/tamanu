import config from 'config';
import { fhirRoutes } from '../../hl7fhir';
import { userMiddleware } from '../../auth/userMiddleware';

// handles its own authentication using a separate secret + token issuance workflow
// TODO: write tests for this once I've verified with Emilio it's the right route
export const publicRoutes = fhirRoutes({
  middleware: [
    userMiddleware({
      secret: config.integrations.fhir.secret,
    }),
  ],
});
