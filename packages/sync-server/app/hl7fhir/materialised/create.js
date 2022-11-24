import asyncHandler from 'express-async-handler';

import { OperationOutcome } from 'shared/utils/fhir';

export function createHandler(FhirResource) {
  return asyncHandler(async (req, res) => {
    res.header('Content-Type', 'application/fhir+json; fhirVersion=4.3');

    try {
      // res.send(record.asFhir());
    } catch (err) {
      const oo = new OperationOutcome([err]);
      res.status(oo.status()).send(oo.asFhir());
    }
  });
}
