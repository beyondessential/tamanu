import { randomRecordId } from '@tamanu/database/demoData/utilities';
import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateMedicationParams extends CommonParams {
  encounterId?: string;
  patientId?: string;
  referenceDataId?: string;
}
export const createMedication = async ({
  models,
  encounterId,
  patientId,
  referenceDataId,
}: CreateMedicationParams): Promise<void> => {
  const {
    Prescription,
    EncounterPrescription,
    PatientOngoingPrescription,
    EncounterPausePrescription,
    EncounterPausePrescriptionHistory,
  } = models;

  const prescription = await Prescription.create(
    fake(Prescription, {
      medicationId: referenceDataId || (await randomRecordId(models, 'ReferenceData')),
    }),
  );

  const encounterPrescription = await EncounterPrescription.create(
    fake(EncounterPrescription, {
      encounterId: encounterId || (await randomRecordId(models, 'Encounter')),
      prescriptionId: prescription.id,
    }),
  );

  await PatientOngoingPrescription.create(
    fake(PatientOngoingPrescription, {
      patientId: patientId || (await randomRecordId(models, 'Patient')),
      prescriptionId: prescription.id,
    }),
  );

  await EncounterPausePrescription.create(
    fake(EncounterPausePrescription, {
      encounterPrescriptionId: encounterPrescription.id,
    }),
  );

  await EncounterPausePrescriptionHistory.create(
    fake(EncounterPausePrescriptionHistory, {
      encounterPrescriptionId: encounterPrescription.id,
    }),
  );
};
