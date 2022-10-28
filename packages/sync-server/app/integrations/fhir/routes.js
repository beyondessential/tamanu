import config from 'config';
import { fhirRoutes } from '../../hl7fhir';
import { userMiddleware } from '../../auth/userMiddleware';

// handles its own authentication using a separate secret + token issuance workflow
export const publicRoutes = fhirRoutes({
  middleware: [
    userMiddleware({
      secret: config.integrations.fhir.secret,
    }),
  ],
});
