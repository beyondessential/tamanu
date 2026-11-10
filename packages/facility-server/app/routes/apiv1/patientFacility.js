import express from 'express';
import { NotFoundError } from '@tamanu/errors';

export const patientFacility = express.Router();

// spec: MFS#marking-a-patient-for-sync-on-desktop
patientFacility.post('/', async (req, res) => {
  const { syncConnection, models, body } = req;
  const { patientId, facilityId } = body;

  req.checkPermission('read', 'Patient');
  req.checkPermission('create', 'SyncPatient');

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
