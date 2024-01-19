import { Router } from 'express';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { OperationOutcome } from '@tamanu/shared/utils/fhir';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';

import { log } from '@tamanu/shared/services/logging';

import { requireClientHeaders as requireClientHeadersMiddleware } from '../../middleware/requireClientHeaders';

import { readHandler } from './read';
import { searchHandler } from './search';
import { createHandler } from './create';

export function fhirRoutes(ctx, requireClientHeaders) {
  const routes = Router();

  routes.use((req, res, next) => {
    if (!['HEAD', 'GET'].includes(req.method)) {
      const { FhirWriteLog } = req.store.models;
      setImmediate(async () => {
        try {
          await FhirWriteLog.fromRequest(req);
        } catch (err) {
          log.error('failed to log FHIR write', { err });
        }
      }).unref();
    }

    res.header('Content-Type', 'application/fhir+json; fhirVersion=4.3');
    next();
  });

  if (requireClientHeaders) {
    routes.use(requireClientHeadersMiddleware);
  }

  const { models } = ctx.store;
  for (const Resource of resourcesThatCanDo(models, FHIR_INTERACTIONS.INSTANCE.READ)) {
    routes.get(`/${Resource.fhirName}/:id`, readHandler(Resource));
  }

  for (const Resource of resourcesThatCanDo(models, FHIR_INTERACTIONS.TYPE.SEARCH)) {
    routes.get(`/${Resource.fhirName}`, searchHandler(Resource));
  }

  for (const Resource of resourcesThatCanDo(models, FHIR_INTERACTIONS.TYPE.CREATE)) {
    routes.post(`/${Resource.fhirName}`, createHandler(Resource));
  }

  routes.use((err, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const oo = new OperationOutcome([err]);
    res.status(oo.status()).send(oo.asFhir());
  });

  return routes;
}
