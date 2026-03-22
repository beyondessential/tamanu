import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import { OperationOutcome } from '@tamanu/shared/utils/fhir';
import { FHIR_INTERACTIONS, JOB_TOPICS } from '@tamanu/constants';

async function mapErr(promise, fn) {
  try {
    return await promise;
  } catch (err) {
    throw fn(err);
  }
}

export const createResource = async (store, FhirResource, data, requesterId, settings) => {
  const { FhirJob } = store.models;
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
    }).validate(data, { stripUnknown: true }),
    err => OperationOutcome.fromYupError(err),
  );

  const resource = new FhirResource(validated);
  const upstream = await resource.pushUpstream({
    settings,
    requesterId,
  });
  if (FhirResource.CAN_DO.has(FHIR_INTERACTIONS.INTERNAL.MATERIALISE)) {
    FhirJob.submit(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, {
      resource: FhirResource.fhirName,
      upstreamId: upstream.id,
    });
  }
};

export function createHandler(FhirResource) {
  return asyncHandler(async (req, res) => {
    await createResource(req.store, FhirResource, req.body, req.user?.id, req.settings);

    // in spec, we should Location: to the resource, but we don't have it yet
    // TODO: generate ID here, and return it (if resource can be materialised)
    res.status(201).send();
  });
}
