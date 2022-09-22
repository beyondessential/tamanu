import asyncHandler from 'express-async-handler';

export function resourceHandler(modelName) {
  return asyncHandler(async (req, res) => {
    const FhirResource = req.store.models[`Fhir${modelName}`];

    res.send({
      help: 'me',
    });
  });
}
