import asyncHandler from 'express-async-handler';
import { mergePatient } from './mergePatient';

export const mergePatientHandler = asyncHandler(async (req, res) => {
  req.checkPermission('write', 'Patient');

  const { body, store } = req;
  const { keepPatientId, unwantedPatientId } = body;
  const result = await mergePatient(store.models, keepPatientId, unwantedPatientId);
  res.send(result);
});
