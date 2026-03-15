import asyncHandler from 'express-async-handler';
import { FHIR_BUNDLE_TYPES, FHIR_INTERACTIONS } from '@tamanu/constants';
import {
  FhirTransactionBundle,
  FhirTransactionResponseBundle,
} from '@tamanu/shared/services/fhirTypes';
import { OperationOutcome } from '@tamanu/shared/utils/fhir';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { createResource } from '../create';
import { InvalidOperationError } from '@tamanu/errors';
import { checkFhirWritePermissionForResource } from '../fhirPermissions';

export const transactionBundleHandler = () => {
  return asyncHandler(async (req, res) => {
    const { settings, store } = req;
    let validatedBundle;
    try {
      validatedBundle = await FhirTransactionBundle.SCHEMA().validate(req.body);
    } catch (err) {
      return res.status(400).send(OperationOutcome.fromYupError(err));
    }

    const creatableResources = resourcesThatCanDo(store.models, FHIR_INTERACTIONS.TYPE.CREATE);

    // Run all operations in a database transaction to ensure atomicity
    const responses = [];
    try {
      await store.sequelize.transaction(async () => {
        for (const { resource: rawResource } of validatedBundle.entry) {
          checkFhirWritePermissionForResource(req.ability, rawResource.resourceType);

          const FhirResource = creatableResources.find(
            r => r.fhirName === rawResource.resourceType,
          );
          if (!FhirResource) {
            throw new InvalidOperationError(`Resource type ${rawResource.resourceType} not found`);
          }

          const hydratedResource = FhirResource.hydrateRawResourceFromBundle(
            validatedBundle,
            rawResource,
          );
          await createResource(store, FhirResource, hydratedResource, req.user?.id, settings);
          responses.push({
            response: {
              status: '201',
            },
          });
        }
      });
    } catch (err) {
      const oo = new OperationOutcome([err]);
      return res.status(oo.status()).send(oo.asFhir());
    }

    const responseBundle = new FhirTransactionResponseBundle({
      resourceType: 'Bundle',
      type: FHIR_BUNDLE_TYPES.TRANSACTION_RESPONSE,
      entry: responses,
    });
    res.status(200).send(responseBundle);
  });
};
