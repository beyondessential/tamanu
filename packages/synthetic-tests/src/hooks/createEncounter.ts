import { fakeCreateEncounterRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createEncounter';

import { RANDOM_PATIENT_NO_OPEN_ENCOUNTER_QUERY } from './randomPatientQuery';

/**
 * Generates an encounter payload with a random patient (with no active encounter), location, and department.
 * Stores the payload and selected patient in context.vars.
 */
export async function generateEncounterPayload(context: any, _events: any): Promise<void> {
  const { entityFetcher } = context.vars;

  const [randomPatient, randomLocation, randomDepartment] = await Promise.all([
    entityFetcher.getRandom('patient', { ...RANDOM_PATIENT_NO_OPEN_ENCOUNTER_QUERY }),
    entityFetcher.getRandom('location'),
    entityFetcher.getRandom('department'),
  ]);

  const encounterPayload = fakeCreateEncounterRequestBody({
    patientId: randomPatient.id,
    examinerId: context.vars.userId,
    locationId: randomLocation.id,
    departmentId: randomDepartment.id,
  });

  context.vars.encounterPayload = encounterPayload;
  context.vars.selectedPatient = randomPatient;
}
