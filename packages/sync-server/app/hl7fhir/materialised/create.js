import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import { OperationOutcome } from 'shared/utils/fhir';
import { FHIR_INTERACTIONS } from 'shared/constants';

async function mapErr(promise, fn) {
  try {
    return await promise;
  } catch (err) {
    throw fn(err);
  }
}

export function createHandler(FhirResource) {
  return asyncHandler(async (req, res) => {
    const { FhirMaterialiseJob } = req.store.models;

    const validated = await mapErr(
      FhirResource.INTAKE_SCHEMA.shape({
        resourceType: yup
          .string()
          .test(
            'is-same-as-route',
            `must be '${FhirResource.fhirName}'`,
            t => t === FhirResource.fhirName,
          )
          .required(),
      }).validate(req.body, { stripUnknown: true }),
      err => OperationOutcome.fromYupError(err),
    );

    const resource = new FhirResource(validated);
    const upstream = await resource.pushUpstream();

    if (FhirResource.CAN_DO.has(FHIR_INTERACTIONS.INTERNAL.MATERIALISE)) {
      FhirMaterialiseJob.enqueue({ resource: FhirResource.fhirName, upstreamId: upstream.id });
    }

    // in spec, we should Location: to the resource, but we don't have it yet
    // TODO: generate ID here, and return it (if resource can be materialised)
    res.status(201).send();
  });
}
