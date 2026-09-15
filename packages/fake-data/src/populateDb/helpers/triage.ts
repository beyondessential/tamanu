import { addMinutes, subMinutes } from 'date-fns';

import { ENCOUNTER_TYPES, REFERENCE_TYPES } from '@tamanu/constants';
import { parseDate, toDateTimeString } from '@tamanu/utils/dateTime';
import { randomRecordId, randomReferenceDataId } from '../randomRecord.js';

import { fake, chance } from '../../fake/index.js';
import { createEncounter } from './encounter.js';
import type { CommonParams } from './common.js';

// Share of seeded triages that have already been closed. The rest stay open so the
// emergency department list has something in it: `GET /triage` only lists triages
// whose encounter is still open (`encounters.end_date IS NULL`), so seeding every
// triage as closed leaves that view empty no matter how many rows exist.
const CLOSED_LIKELIHOOD = 70;

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
  // Both complaints are picked from the same pool, so they can land on the same row.
  // A patient doesn't present with the same complaint twice — record no secondary
  // complaint rather than "…with chest pain and chest pain".
  const secondaryComplaintId =
    pickedSecondaryComplaintId === chiefComplaintId ? null : pickedSecondaryComplaintId;

  const triageData = fake(Triage, {
    practitionerId: examinerId,
    chiefComplaintId,
    secondaryComplaintId,
    arrivalModeId,
    score: chance.pickone(['1', '2', '3', '4', '5']),
  });

  // `fake` draws every datetime column independently, so left alone a triage gets an
  // arrival, a triage and a close time years apart and in any order. Anchor the other
  // two to triageTime: the patient arrives shortly before being triaged, and the triage
  // closes between 20 minutes and 24 hours after being raised.
  const triageTime = parseDate(triageData.triageTime);
  const arrivalTime = toDateTimeString(
    subMinutes(triageTime, chance.integer({ min: 1, max: 120 })),
  );
  // An open triage has no closed time, and its encounter is still running.
  const isClosed = chance.bool({ likelihood: CLOSED_LIKELIHOOD });
  // Closing an encounter stamps the same timestamp onto its triage (see
  // `Encounter.closeTriage`), so the two must match.
  const closedTime = isClosed
    ? toDateTimeString(addMinutes(triageTime, chance.integer({ min: 20, max: 24 * 60 })))
    : null;

  // A triage always creates its own encounter (see `Triage.create`), so a triage
  // encounter never has more than one triage on it. Seed a dedicated encounter
  // per triage rather than attaching to an existing one, which would otherwise
  // let two triages land on the same encounter.
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
    // Every path that closes an encounter writes a discharge alongside it (see
    // `Encounter.onDischarge` and `dischargeOutpatientEncounters`), so a closed
    // encounter without one is a state the app can't produce.
    isDischarged: isClosed,
    // `POST /triage` records no diagnoses, and exactly one note — the triage score,
    // added below. `createEncounter` would otherwise throw in a handful of random
    // ones each, inflating the seed well past the Note tally it is driven by.
    noteCount: 0,
    diagnosisCount: 0,
  });

  // The one note a triage really does leave on its encounter (see `POST /triage`).
  const department = await models.Department.findByPk(encounter.departmentId);
  await encounter.addSystemNote(
    `${department.name} triage score: ${triageData.score}`,
    triageData.triageTime,
    { id: examinerId },
  );

  // `Triage.create` has business logic that creates the encounter itself — bypass
  // it with build().save() now that we have supplied the encounter above.
  await Triage.build({ ...triageData, arrivalTime, closedTime, encounterId: encounter.id }).save();
};
