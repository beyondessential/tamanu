import { Router } from 'express';

import { FHIR_INTERACTIONS } from 'shared/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

import { requireClientHeaders as requireClientHeadersMiddleware } from '../../middleware/requireClientHeaders';

import { readHandler } from './read';
import { searchHandler } from './search';
import { createHandler } from './create';

export function fhirRoutes({ requireClientHeaders } = {}) {
  const routes = Router();

  if (requireClientHeaders) {
    routes.use(requireClientHeadersMiddleware);
  }

  for (const Resource of resourcesThatCanDo(FHIR_INTERACTIONS.INSTANCE.READ)) {
    routes.get(`/${Resource.fhirName}/:id`, readHandler(Resource));
  }

  for (const Resource of resourcesThatCanDo(FHIR_INTERACTIONS.TYPE.SEARCH)) {
    routes.get(`/${Resource.fhirName}`, searchHandler(Resource));
  }

  for (const Resource of resourcesThatCanDo(FHIR_INTERACTIONS.TYPE.CREATE)) {
    routes.post(`/${Resource.fhirName}`, createHandler(Resource));
  }

  // TODO: handle method/route errors with FHIR errors
  // and/or use a generic FHIR error handler middleware

  return routes;
}
