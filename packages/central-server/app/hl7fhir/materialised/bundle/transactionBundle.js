import asyncHandler from 'express-async-handler';
import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { FhirTransactionBundle } from '@tamanu/shared/services/fhirTypes';
import { OperationOutcome } from '@tamanu/shared/utils/fhir';
import { resourcesThatCanDo } from '@tamanu/shared/utils/fhir/resources';
import { createResource } from '../create';
import { InvalidOperationError } from '@tamanu/errors';

export const transactionBundleHandler = () => {
  return asyncHandler(async (req, res) => {
    const { settings, store } = req;
    let validatedBundle;
    try {
      validatedBundle = await FhirTransactionBundle.SCHEMA().validate(req.body);
    } catch (err) {
      return res.status(400).send(OperationOutcome.fromYupError(err));
    }

    const createableResources = resourcesThatCanDo(store.models, FHIR_INTERACTIONS.TYPE.CREATE);

    // Run all operations in a database transaction to ensure atomicity
    try {
      await store.sequelize.transaction(async () => {
        for (const { resource: rawResource } of validatedBundle.entry) {
          const FhirResource = createableResources.find(
            r => r.fhirName === rawResource.resourceType,
          );
          if (!FhirResource) {
            throw new InvalidOperationError(`Resource type ${rawResource.resourceType} not found`);
          }

          await createResource(store, FhirResource, rawResource, req.user?.id, settings);
        }
      });
    } catch (err) {
      return res.status(400).send(new OperationOutcome([err]));
    }

    // TODO: generate ID here, and return it (if resource can be materialised)
    res.status(201).send();
  });
};
