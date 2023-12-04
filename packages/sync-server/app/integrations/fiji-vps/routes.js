import { fhirRoutes } from '../../hl7fhir';

export const routes = (ctx, requireClientHeaders) => fhirRoutes(ctx, requireClientHeaders);
