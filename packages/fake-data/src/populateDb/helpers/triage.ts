import { addMinutes, subMinutes } from 'date-fns';

import { ENCOUNTER_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import { parseDate, toDateTimeString } from '@tamanu/utils/dateTime';
import { randomRecordId, randomReferenceDataId } from '../randomRecord.js';

import { fake, chance } from '../../fake/index.js';
import { createEncounter } from './encounter.js';
import type { CommonParams } from './common.js';

interface CreateTriageParams extends CommonParams {
  patientId?: string;
  practitionerId?: string;
}
export const createTriage = async ({
  models,
  patientId,
  practitionerId,
}: CreateTriageParams): Promise<void> => {
  const { Triage } = models;

  const examinerId = practitionerId || (await randomRecordId(models, 'User'));
  const [chiefComplaintId, pickedSecondaryComplaintId, arrivalModeId] = await Promise.all([
    randomReferenceDataId(models, REFERENCE_TYPES.TRIAGE_REASON),
    randomReferenceDataId(models, REFERENCE_TYPES.TRIAGE_REASON),
    randomReferenceDataId(models, REFERENCE_TYPES.ARRIVAL_MODE),
  ]);
  // Both complaints come from one pool, so they can pick the same row.
  const secondaryComplaintId =
    pickedSecondaryComplaintId === chiefComplaintId ? null : pickedSecondaryComplaintId;

  const triageData = fake(Triage, {
    practitionerId: examinerId,
    chiefComplaintId,
    secondaryComplaintId,
    arrivalModeId,
    score: chance.pickone(['1', '2', '3', '4', '5']),
  });

  // `fake` draws each datetime independently, so anchor arrival and close to triageTime.
  const triageTime = parseDate(triageData.triageTime);
  const arrivalTime = toDateTimeString(
    subMinutes(triageTime, chance.integer({ min: 1, max: 120 })),
  );
  // Must equal the encounter's endDate: `Encounter.closeTriage` stamps it onto the triage.
  const closedTime = toDateTimeString(
    addMinutes(triageTime, chance.integer({ min: 20, max: 24 * 60 })),
  );

  const [chiefComplaint, secondaryComplaint] = await Promise.all(
    [chiefComplaintId, secondaryComplaintId].map(id =>
      id ? models.ReferenceData.findByPk(id) : null,
    ),
  );
  const { encounter } = await createEncounter({
    models,
    patientId,
    userId: examinerId,
    encounterType: ENCOUNTER_TYPES.TRIAGE,
    startDate: triageData.triageTime,
    endDate: closedTime,
    reasonForEncounter: Triage.buildReasonForEncounter(chiefComplaint, secondaryComplaint),
    // Every path that closes an encounter also writes a discharge.
    isDischarged: true,
    // `POST /triage` writes no diagnoses and only the triage-score note below.
    noteCount: 0,
    diagnosisCount: 0,
  });

  const department = await models.Department.findByPk(encounter.departmentId);
  await encounter.addSystemNote(
    `${department.name} triage score: ${triageData.score}`,
    triageData.triageTime,
    { id: examinerId },
  );

  // `Triage.create` would create a second encounter.
  await Triage.build({ ...triageData, arrivalTime, closedTime, encounterId: encounter.id }).save();
};
