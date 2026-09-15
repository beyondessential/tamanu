import { addMinutes } from 'date-fns';

import { NOTE_RECORD_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import type { Encounter } from '@tamanu/database';
import { parseDate, toDateTimeString } from '@tamanu/utils/dateTime';
import { randomRecordId, randomReferenceDataId } from '../randomRecord.js';

import { times } from 'es-toolkit/compat';
import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

// Longest a seeded encounter runs before it is discharged. Triage encounters are much
// shorter and set their own end (see `createTriage`).
const LONGEST_STAY_IN_MINUTES = 90 * 24 * 60;

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
  startDate = '2023-12-21T04:59:51.851Z',
  endDate,
  reasonForEncounter,
  noteCount = chance.integer({ min: 1, max: 5 }),
  diagnosisCount = chance.integer({ min: 1, max: 5 }),
  isDischarged = chance.bool(),
}: CreateEncounterParams): Promise<{ encounter: Encounter }> => {
  const { Encounter, Note, Discharge, EncounterDiagnosis } = models;

  // An encounter that hasn't been discharged is still open, and an open encounter has no
  // end date. `fake` would otherwise draw endDate independently across a five-year span,
  // landing a good half of them before the encounter started.
  const resolvedEndDate =
    endDate !== undefined
      ? endDate
      : isDischarged
        ? toDateTimeString(
            addMinutes(
              parseDate(startDate),
              chance.integer({ min: 30, max: LONGEST_STAY_IN_MINUTES }),
            ),
          )
        : null;

  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId: patientId || (await randomRecordId(models, 'Patient')),
      departmentId: departmentId || (await randomRecordId(models, 'Department')),
      locationId: locationId || (await randomRecordId(models, 'Location')),
      examinerId: userId || (await randomRecordId(models, 'User')),
      startDate,
      endDate: resolvedEndDate,
      // Only override when given: `fake` treats any key present in the overrides as
      // authoritative, so passing `undefined` would blank the generated value.
      ...(encounterType ? { encounterType } : {}),
      ...(reasonForEncounter ? { reasonForEncounter } : {}),
    }),
  );

  // No EncounterHistory here: `Encounter.create` already writes the initial
  // snapshot from the encounter itself.

  for (const _ of times(diagnosisCount)) {
    await EncounterDiagnosis.create(
      fake(EncounterDiagnosis, {
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
