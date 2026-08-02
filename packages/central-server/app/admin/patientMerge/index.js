import asyncHandler from 'express-async-handler';
import { mergePatient } from './mergePatient';

export const mergePatientHandler = asyncHandler(async (req, res) => {
  req.checkPermission('write', 'Patient');

  const { body, store, settings } = req;
  const { keepPatientId, unwantedPatientId } = body;
  const updateDependentRecordsForResyncEnabled = await settings.get(
    'patientMerge.updateDependentRecordsForResyncEnabled',
  );
  const result = await mergePatient(
    store.models,
    keepPatientId,
    unwantedPatientId,
    updateDependentRecordsForResyncEnabled,
  );
  res.send(result);
});
