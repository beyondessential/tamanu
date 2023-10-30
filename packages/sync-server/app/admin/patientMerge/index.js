import asyncHandler from 'express-async-handler';
import { mergePatient } from './mergePatient';

export const mergePatientHandler = asyncHandler(async (req, res) => {
  const { body, store, settings } = req;
  const { keepPatientId, unwantedPatientId } = body;
  const result = await mergePatient(
    { models: store.models, settings },
    keepPatientId,
    unwantedPatientId,
  );
  res.send(result);
});
