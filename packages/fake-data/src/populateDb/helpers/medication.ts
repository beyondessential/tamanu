import type { Models } from '@tamanu/database';
import { fake } from '../../fake';

interface CreateMedicationParams {
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
    MedicationAdministrationRecord,
  },
  encounterId,
  patientId,
  referenceDataId,
}: CreateMedicationParams): Promise<void> => {
  const prescription = await Prescription.create(
    fake(Prescription, {
      medicationId: referenceDataId,
    }),
  );
  await EncounterPrescription.create(
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
      encounterPrescriptionId: prescription.id,
    }),
  );
  await EncounterPausePrescriptionHistory.create(
    fake(EncounterPausePrescriptionHistory, {
      encounterPrescriptionId: prescription.id,
    }),
  );
  await MedicationAdministrationRecord.create(
    fake(MedicationAdministrationRecord, {
      prescriptionId: prescription.id,
    }),
  );
};
