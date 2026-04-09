import { ENCOUNTER_TYPES, NOTE_RECORD_TYPES } from '@tamanu/constants';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateTriageParams extends CommonParams {
  patientId?: string;
  departmentId?: string;
  locationId?: string;
  practitionerId?: string;
}
export const createTriage = async ({
  models,
  patientId,
  departmentId,
  locationId,
  practitionerId,
}: CreateTriageParams): Promise<void> => {
  const { Encounter, EncounterHistory, Triage, Note } = models;

  const encounter = await Encounter.create(
    fake(Encounter, {
      encounterType: ENCOUNTER_TYPES.TRIAGE,
      patientId: patientId || (await randomRecordId(models, 'Patient')),
      departmentId: departmentId || (await randomRecordId(models, 'Department')),
      locationId: locationId || (await randomRecordId(models, 'Location')),
      examinerId: practitionerId || (await randomRecordId(models, 'User')),
    }),
  );

  await EncounterHistory.create(
    fake(EncounterHistory, {
      encounterId: encounter.id,
      encounterType: ENCOUNTER_TYPES.TRIAGE,
      examinerId: practitionerId || (await randomRecordId(models, 'User')),
      departmentId: departmentId || (await randomRecordId(models, 'Department')),
      locationId: locationId || (await randomRecordId(models, 'Location')),
    }),
  );

  const triage = await Triage.create(
    fake(Triage, {
      encounterId: encounter.id,
      practitionerId: practitionerId || (await randomRecordId(models, 'User')),
      score: chance.pickone(['1', '2', '3', '4', '5']),
    }),
  );

  await Note.create(
    fake(Note, {
      recordType: NOTE_RECORD_TYPES.TRIAGE,
      recordId: triage.id,
      authorId: practitionerId || (await randomRecordId(models, 'User')),
    }),
  );
};
