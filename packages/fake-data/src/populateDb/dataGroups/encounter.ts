import { NOTE_RECORD_TYPES } from '@tamanu/constants';
import type { Models, Encounter } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateEncounterParams {
  models: Models;
  patientId: string;
  departmentId: string;
  locationId: string;
  userId: string;
  referenceDataId: string;
}
export const createEncounter = async ({
  models: { Encounter, EncounterHistory, Note, Discharge, EncounterDiagnosis },
  patientId,
  departmentId,
  locationId,
  userId,
  referenceDataId,
}: CreateEncounterParams): Promise<{ encounter: Encounter }> => {
  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId,
      departmentId,
      locationId,
      examinerId: userId,
      startDate: '2023-12-21T04:59:51.851Z',
    }),
  );
  await EncounterHistory.create(
    fake(EncounterHistory, {
      examinerId: userId,
      encounterId: encounter.id,
      departmentId,
      locationId,
    }),
  );
  await EncounterDiagnosis.create(
    fake(EncounterDiagnosis, {
      diagnosisId: referenceDataId,
      encounterId: encounter.id,
    }),
  );
  await Note.create(
    fake(Note, {
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      recordId: encounter.id,
      authorId: userId,
    }),
  );
  await Discharge.create(
    fake(Discharge, {
      encounterId: encounter.id,
      dischargerId: userId,
    }),
  );
  return { encounter };
};
