import express from 'express';
import { NotFoundError } from '@tamanu/errors';

export const patientFacility = express.Router();

patientFacility.post('/$', async (req, res) => {
  const { syncConnection, models, body } = req;
  const { patientId, facilityId } = body;

  // slightly unusual to check read permissions in a post endpoint, but if you can read patients,
  // you can mark them for sync
  req.checkPermission('read', 'Patient');

  const patient = await models.Patient.findByPk(patientId);
  if (!patient) {
    throw new NotFoundError();
  }

  // this endpoint functions as a "find or update", avoiding any issues where another device marks
  // the patient for sync, and that copy syncs in after the user is already in the patient page
  const [record] = await models.PatientFacility.findOrCreate({
    where: { facilityId, patientId },
  });

  // trigger a sync to immediately start pulling data for this patient
  await syncConnection.runSync({
    urgent: true,
    type: 'patientMarkedForSync',
    patientId: patient.id,
    patientDisplayId: patient.displayId,
  });

  res.send(record);
});
