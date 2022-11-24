import asyncHandler from 'express-async-handler';

import { OperationOutcome } from 'shared/utils/fhir';

import { fhirQueue } from '../../tasks/FhirMaterialiser';

async function mapErr(promise, fn) {
  try {
    return await promise;
  } catch (err) {
    throw fn(err);
  }
}

export function createHandler(FhirResource) {
  return asyncHandler(async (req, res) => {
    try {
      const validated = await mapErr(
        FhirResource.INTAKE_SCHEMA.validate(req.body, { stripUnknown: true }),
        err => OperationOutcome.fromYupError(err),
      );

      const resource = new FhirResource(validated);
      const upstream = await resource.pushUpstream();

      if (FhirResource.CAN_DO.has(FHIR_INTERACTIONS.INTERNAL.MATERIALISE)) {
        fhirQueue(FhirResource.fhirName, upstream.id);
      }

      // in spec, we should Location: to the resource, but we don't have it yet
      // TODO: generate ID here, and return it (if resource can be materialised)
      res.status(201).send();
    } catch (err) {
      const oo = new OperationOutcome([err]);
      res.status(oo.status()).send(oo.asFhir());
    }
  });
}
