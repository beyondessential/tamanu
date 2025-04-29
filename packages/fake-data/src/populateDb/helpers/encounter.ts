import { NOTE_RECORD_TYPES } from '@tamanu/constants';
import type { Encounter } from '@tamanu/database';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { times } from 'lodash';
import { fake, chance } from '../../fake';
import type { CommonParams } from './common';

interface CreateEncounterParams extends CommonParams {
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
  models,
  limit,
  patientId,
  departmentId,
  locationId,
  userId,
  referenceDataId,
  noteCount = chance.integer({ min: 1, max: 5 }),
  diagnosisCount = chance.integer({ min: 1, max: 5 }),
  isDischarged = chance.bool(),
}: CreateEncounterParams): Promise<{ encounter: Encounter }> => {
  const { Encounter, EncounterHistory, Note, Discharge, EncounterDiagnosis } = models;

  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId: patientId || (await randomRecordId(models, 'Patient')),
      departmentId: departmentId || (await randomRecordId(models, 'Department')),
      locationId: locationId || (await randomRecordId(models, 'Location')),
      examinerId: userId || (await randomRecordId(models, 'User')),
      startDate: '2023-12-21T04:59:51.851Z',
    }),
  );

  await EncounterHistory.create(
    fake(EncounterHistory, {
      examinerId: userId || (await randomRecordId(models, 'User')),
      encounterId: encounter.id,
      departmentId: departmentId || (await randomRecordId(models, 'Department')),
      locationId: locationId || (await randomRecordId(models, 'Location')),
    }),
  );

  await Promise.all(
    times(diagnosisCount, () =>
      limit(async () => {
        await EncounterDiagnosis.create(
          fake(EncounterDiagnosis, {
            diagnosisId: referenceDataId || (await randomRecordId(models, 'ReferenceData')),
            encounterId: encounter.id,
          }),
        );
      }),
    ),
  );

  await Promise.all(
    times(noteCount, () =>
      limit(async () => {
        await Note.create(
          fake(Note, {
            recordType: NOTE_RECORD_TYPES.ENCOUNTER,
            recordId: encounter.id,
            authorId: userId || (await randomRecordId(models, 'User')),
          }),
        );
      }),
    ),
  );

  if (isDischarged) {
    await Discharge.create(
      fake(Discharge, {
        encounterId: encounter.id,
        dischargerId: userId || (await randomRecordId(models, 'User')),
      }),
    );
  }
  return { encounter };
};
