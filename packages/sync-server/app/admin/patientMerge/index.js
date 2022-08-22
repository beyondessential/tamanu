import asyncHandler from 'express-async-handler';
import { mergePatient } from './mergePatient';

export const mergePatientHandler = asyncHandler(async (req, res) => {
  const { body, models } = req;
  const { canonicalPatientId, redundantPatientId } = body;
  const result = await mergePatient(models, canonicalPatientId, redundantPatientId);
  res.send(result);
});