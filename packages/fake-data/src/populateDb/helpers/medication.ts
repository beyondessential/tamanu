import { REFERENCE_TYPES } from '@tamanu/constants';

import { randomRecordId, randomReferenceDataId } from '../randomRecord.js';
import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateMedicationParams extends CommonParams {
  encounterId?: string;
  referenceDataId?: string;
}
export const createMedication = async ({
  models,
  encounterId,
  referenceDataId,
}: CreateMedicationParams): Promise<void> => {
  const {
    Prescription,
    EncounterPrescription,
    PatientOngoingPrescription,
    EncounterPausePrescription,
  } = models;

  // Create with hooks disabled: the afterCreate hook tries to push a notification
  // via EncounterPrescription.encounter, but EncounterPrescription doesn't exist yet
  const prescription = await Prescription.create(
    fake(Prescription, {
      medicationId: referenceDataId || (await randomReferenceDataId(models, REFERENCE_TYPES.DRUG)),
    }),
    { hooks: false },
  );

  const prescribingEncounterId = encounterId ?? (await randomRecordId(models, 'Encounter'));
  const encounterPrescription = await EncounterPrescription.create(
    fake(EncounterPrescription, {
      encounterId: prescribingEncounterId,
      prescriptionId: prescription.id,
    }),
  );

  // Must match the encounter's patient, or the prescription syncs as belonging to two patients.
  const prescribingEncounter = await models.Encounter.findByPk(prescribingEncounterId, {
    attributes: ['patientId'],
  });
  await PatientOngoingPrescription.create(
    fake(PatientOngoingPrescription, {
      patientId: prescribingEncounter.patientId,
      prescriptionId: prescription.id,
    }),
  );

  await EncounterPausePrescription.create(
    fake(EncounterPausePrescription, {
      encounterPrescriptionId: encounterPrescription.id,
    }),
  );
};
