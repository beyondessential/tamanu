import { Router } from 'express';

import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { OperationOutcome } from '../../utils/fhir';
import { resourcesThatCanDo } from '../../utils/fhir/resources';

import { log } from '../../services/logging';

import { requireClientHeaders as requireClientHeadersMiddleware } from './middleware/requireClientHeaders';

import { patientSummaryHandler } from './patientSummary';
import { readHandler } from './read';
import { searchHandler } from './search';
import { createHandler } from './create';
import { transactionBundleHandler } from './bundle';
import {
  checkFhirReadPermission,
  checkFhirWritePermission,
  checkFhirBundleWritePermission,
} from './fhirPermissions';

export function fhirRoutes(ctx, { requireClientHeaders } = {}) {
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

  const flagPermissionChecked = (req, res, next) => {
    if (req.flagPermissionChecked) {
      req.flagPermissionChecked();
    }
    next();
  };

  routes.get(
    `/Patient/:id/$summary`,
    checkFhirReadPermission({ fhirName: 'Patient' }),
    flagPermissionChecked,
    patientSummaryHandler(),
  );

  const { models } = ctx.store;
  for (const Resource of resourcesThatCanDo(models, FHIR_INTERACTIONS.INSTANCE.READ)) {
    routes.get(
      `/${Resource.fhirName}/:id`,
      checkFhirReadPermission(Resource),
      flagPermissionChecked,
      readHandler(Resource),
    );
  }

  for (const Resource of resourcesThatCanDo(models, FHIR_INTERACTIONS.TYPE.SEARCH)) {
    routes.get(
      `/${Resource.fhirName}`,
      checkFhirReadPermission(Resource),
      flagPermissionChecked,
      searchHandler(Resource),
    );
  }

  for (const Resource of resourcesThatCanDo(models, FHIR_INTERACTIONS.TYPE.CREATE)) {
    routes.post(
      `/${Resource.fhirName}`,
      checkFhirWritePermission(Resource),
      flagPermissionChecked,
      createHandler(Resource),
    );
  }

  routes.post(
    `/Bundle`,
    checkFhirBundleWritePermission(),
    flagPermissionChecked,
    transactionBundleHandler(),
  );

  routes.use((err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    // allow send when ensurePermissionCheck wrapped res.send (e.g. permission denied before flagPermissionChecked ran)
    if (req.flagPermissionChecked) {
      req.flagPermissionChecked();
    }

    const oo = new OperationOutcome([err]);
    res.status(oo.status()).send(oo.asFhir());
  });

  return routes;
}
