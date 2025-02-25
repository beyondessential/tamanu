import { NOTE_RECORD_TYPES } from '@tamanu/constants';
import type { Models, Encounter } from '@tamanu/database';
import { times } from 'lodash';
const { fake, chance } = require('@tamanu/shared/test-helpers/fake');

interface CreateEncounterParams {
  models: Models;
  patientId: string;
  departmentId: string;
  locationId: string;
  userId: string;
  referenceDataId: string;
  noteCount?: number;
  diagnosisCount?: number;
  isDischarged?: boolean;
}
export const createEncounter = async ({
  models: { Encounter, EncounterHistory, Note, Discharge, EncounterDiagnosis },
  patientId,
  departmentId,
  locationId,
  userId,
  referenceDataId,
  noteCount = chance.integer({ min: 1, max: 5 }),
  diagnosisCount = chance.integer({ min: 1, max: 5 }),
  isDischarged = chance.bool(),
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

  times(diagnosisCount, async () => {
    await EncounterDiagnosis.create(
      fake(EncounterDiagnosis, {
        diagnosisId: referenceDataId,
        encounterId: encounter.id,
      }),
    );
  });

  times(noteCount, async () => {
    await Note.create(
      fake(Note, {
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        authorId: userId,
      }),
    );
  });

  if (isDischarged) {
    await Discharge.create(
      fake(Discharge, {
        encounterId: encounter.id,
        dischargerId: userId,
      }),
    );
  }
  return { encounter };
};
