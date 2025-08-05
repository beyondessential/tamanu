import type { Models } from '@tamanu/database';
import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateMedicationParams extends CommonParams {
  models: Models;
  encounterId: string;
  patientId: string;
  referenceDataId: string;
}
export const createMedication = async ({
  models: {
    Prescription,
    EncounterPrescription,
    PatientOngoingPrescription,
    EncounterPausePrescription,
    EncounterPausePrescriptionHistory,
  },
  encounterId,
  patientId,
  referenceDataId,
}: CreateMedicationParams): Promise<void> => {
  const prescription = await Prescription.create(
    fake(Prescription, {
      medicationId: referenceDataId,
    }),
    {
      hooks: false, // Disable hooks to prevent afterCreate from triggering
    },
  );

  const encounterPrescription = await EncounterPrescription.create(
    fake(EncounterPrescription, {
      encounterId,
      prescriptionId: prescription.id,
    }),
  );

  await PatientOngoingPrescription.create(
    fake(PatientOngoingPrescription, {
      patientId: patientId,
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
