import { NOTE_RECORD_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import type { Encounter } from '@tamanu/database';
import { randomRecordId, randomReferenceDataId } from '../randomRecord.js';

import { times } from 'es-toolkit/compat';
import { addDays } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { fake, chance, fakeDate } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateEncounterParams extends CommonParams {
  patientId?: string;
  departmentId?: string;
  locationId?: string;
  userId?: string;
  referenceDataId?: string;
  encounterType?: string;
  startDate?: string;
  endDate?: string | null;
  reasonForEncounter?: string;
  noteCount?: number;
  diagnosisCount?: number;
  isDischarged?: boolean;
}
export const createEncounter = async ({
  models,
  patientId,
  departmentId,
  locationId,
  userId,
  referenceDataId,
  encounterType,
  startDate,
  endDate,
  reasonForEncounter,
  noteCount = chance.integer({ min: 1, max: 5 }),
  diagnosisCount = chance.integer({ min: 1, max: 5 }),
  isDischarged = chance.bool(),
}: CreateEncounterParams): Promise<{ encounter: Encounter }> => {
  const { Encounter, Note, Discharge, EncounterDiagnosis } = models;

  const resolvedStartDate = startDate ?? toDateTimeString(fakeDate());
  // A discharged encounter has ended, and an open one has no end date yet.
  const resolvedEndDate =
    endDate !== undefined
      ? endDate
      : isDischarged
        ? toDateTimeString(
            new Date(
              Math.min(
                addDays(new Date(resolvedStartDate), chance.integer({ min: 0, max: 14 })).getTime(),
                Date.now(),
              ),
            ),
          )
        : null;

  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId: patientId || (await randomRecordId(models, 'Patient')),
      departmentId: departmentId || (await randomRecordId(models, 'Department')),
      locationId: locationId || (await randomRecordId(models, 'Location')),
      examinerId: userId || (await randomRecordId(models, 'User')),
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      // `fake` treats any key present as authoritative, so an undefined override blanks it.
      ...(encounterType ? { encounterType } : {}),
      ...(reasonForEncounter ? { reasonForEncounter } : {}),
    }),
  );

  for (const index of times(diagnosisCount)) {
    await EncounterDiagnosis.create(
      fake(EncounterDiagnosis, {
        isPrimary: index === 0,
        diagnosisId:
          referenceDataId || (await randomReferenceDataId(models, REFERENCE_TYPES.DIAGNOSIS)),
        encounterId: encounter.id,
        clinicianId: userId || (await randomRecordId(models, 'User')),
      }),
    );
  }

  for (const _ of times(noteCount)) {
    await Note.create(
      fake(Note, {
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        authorId: userId || (await randomRecordId(models, 'User')),
      }),
    );
  }

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
