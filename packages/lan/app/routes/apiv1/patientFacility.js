import express from 'express';
import config from 'config';
import { NotFoundError } from 'shared/errors';

export const patientFacility = express.Router();

patientFacility.post('/$', async (req, res) => {
  const { models, body, syncManager } = req;
  const { patientId } = body;

  // slightly unusual to check read permissions in a post endpoint, but if you can read patients,
  // you can mark them for sync
  req.checkPermission('read', 'Patient');

  const patient = await models.Patient.findByPk(patientId);
  if (!patient) {
    throw new NotFoundError();
  }

  const facilityId = config.serverFacilityId;

  // this endpoint functions as a "find or update", avoiding any issues where another device marks
  // the patient for sync, and that copy syncs in after the user is already in the patient page
  const record = await models.PatientFacility.findOrCreate({
    where: { facilityId, patientId },
  });

  // trigger a sync to immediately start pulling data for this patient
  syncManager.triggerSync({
    urgent: true,
    type: 'patientMarkedForSync',
    patientId: patient.id,
    patientDisplayId: patient.displayId,
  });

  res.send(record);
});
